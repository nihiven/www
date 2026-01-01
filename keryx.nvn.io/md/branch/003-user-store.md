# Branch: User Store

## Problem

Currently, nick data is stored in a `Vec<Nick>` inside each `ChannelData` struct. This creates several issues:

1. **Duplicated data** - A user in 3 channels has 3 separate `Nick` structs
2. **QUIT is expensive** - Must iterate every channel to remove a user
3. **Lost information** - No place to store `user@host`, realname, away status
4. **Scripting limitations** - No way to query "all users I can see" globally
5. **Nick changes are fragile** - Must update every channel independently

## Solution

Create a centralized `UserStore` that holds all user data. Channels reference users by ID instead of storing copies.

## Design

### UserId (newtype pattern)

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct UserId(usize);
```

Type-safe, zero-cost abstraction. Can be used as HashMap key.

### User struct

```rust
#[derive(Debug, Clone)]
pub struct User {
    pub id: UserId,
    pub nick: String,
    pub user: Option<String>,           // ident (~username)
    pub host: Option<String>,           // hostname
    pub realname: Option<String>,       // GECOS field from WHOIS
    pub away: Option<String>,           // away message if set
    pub account: Option<String>,        // NickServ account if identified
    pub last_seen: Option<DateTime<Local>>,    // updated on any activity
    pub last_message: Option<DateTime<Local>>, // updated only on PRIVMSG
}
```

**Note:** Users are kept indefinitely (not removed on QUIT). This enables:
- `!seen` functionality natively
- Address book / friends list features
- Historical data accumulation

### UserStore

```rust
pub struct UserStore {
    users: HashMap<UserId, User>,
    nick_index: HashMap<String, UserId>,  // lowercase nick -> id
    host_index: HashMap<String, UserId>,  // "user@host" -> id
    next_id: usize,
}

impl UserStore {
    pub fn new() -> Self;

    /// Find or create user. Updates existing if more info provided.
    pub fn upsert(&mut self, nick: &str, user: Option<&str>, host: Option<&str>) -> UserId;

    /// Get user by ID
    pub fn get(&self, id: UserId) -> Option<&User>;
    pub fn get_mut(&mut self, id: UserId) -> Option<&mut User>;

    /// Lookup by nick (case-insensitive)
    pub fn find_by_nick(&self, nick: &str) -> Option<UserId>;

    /// Lookup by user@host
    pub fn find_by_hostmask(&self, user: &str, host: &str) -> Option<UserId>;

    /// Handle NICK change
    pub fn rename(&mut self, old_nick: &str, new_nick: &str) -> Option<UserId>;

    /// Mark user as offline (QUIT) - does NOT remove from store
    pub fn set_offline(&mut self, id: UserId);

    /// Check if user is currently online
    pub fn is_online(&self, id: UserId) -> bool;

    /// Get all users (for scripting/iteration)
    pub fn iter(&self) -> impl Iterator<Item = &User>;
}
```

### ChannelMember (replaces Nick in ChannelData)

```rust
pub struct ChannelMember {
    pub user_id: UserId,
    pub prefix: Option<char>,  // channel mode prefix: @, +, %, ~, &
}

impl ChannelMember {
    pub fn new(user_id: UserId) -> Self;
    pub fn with_prefix(user_id: UserId, prefix: char) -> Self;
}
```

### Updated ChannelData

```rust
pub struct ChannelData {
    pub members: Vec<ChannelMember>,
    pub topic: String,
    pub user_prefix: Option<String>,  // our prefix in this channel
}

impl ChannelData {
    /// Find member by UserId
    pub fn find_member(&self, user_id: UserId) -> Option<&ChannelMember>;

    /// Add a member to the channel
    pub fn add_member(&mut self, user_id: UserId, prefix: Option<char>);

    /// Remove a member from the channel
    pub fn remove_member(&mut self, user_id: UserId) -> bool;

    /// Update member's prefix (MODE change)
    pub fn set_member_prefix(&mut self, user_id: UserId, prefix: Option<char>);
}
```

## Identity Resolution

IRC identifies users by hostmask: `nick!user@host`

- `nick` can change (NICK command)
- `user@host` is stable for a session (mostly)

### Resolution strategy:

1. If we have `user@host`, lookup by hostmask first
2. Fall back to nick lookup if hostmask unknown
3. `upsert()` merges data - if we learn a user's host later, update the record

### When we learn user@host:

- JOIN messages: `:nick!user@host JOIN #channel`
- PRIVMSG/NOTICE: `:nick!user@host PRIVMSG #channel :text`
- WHO replies: contains full user info
- WHOIS replies: detailed user info

## Implementation Steps

### Phase 1: Core UserStore
- [ ] Create `src/irc/users.rs` module
- [ ] Implement `UserId` newtype
- [ ] Implement `User` struct
- [ ] Implement `UserStore` with basic operations
- [ ] Add unit tests for UserStore

### Phase 2: Integrate with ChannelData
- [ ] Create `ChannelMember` struct
- [ ] Update `ChannelData` to use `Vec<ChannelMember>`
- [ ] Update `ChannelData` methods to work with UserIds
- [ ] Deprecate/remove old `Nick` struct (or keep for display purposes)

### Phase 3: Update Message Handlers
- [ ] Update JOIN handler to upsert user and add to channel
- [ ] Update PART handler to remove from channel (not from store)
- [ ] Update QUIT handler to mark offline and remove from all channels (keep in store)
- [ ] Update NICK handler to rename in store
- [ ] Update PRIVMSG handler to upsert user (learns hostmask), update last_seen/last_message
- [ ] Update 353 (NAMES) handler to populate channel members

### Phase 4: Update UI
- [ ] Update nick list rendering to resolve UserId -> User -> display
- [ ] Update message rendering to use UserStore for nick lookups

## Future Considerations

### SQLite Persistence (later branch)
The `UserStore` API is designed to eventually back onto SQLite:
- User records could be cached/persisted
- Chat logs would reference UserId
- Settings and address book in same DB

### Scripting Access
`UserStore` provides the foundation for scripting:
```rust
// Example future scripting API
users.find("nihiven")           // -> Option<&User>
users.iter().filter(|u| ...)    // -> iterate all known users
channel.members()               // -> iterate channel members
```

## Design Decisions

1. **Track "last seen" timestamp per user?** YES - `last_seen` and `last_message` fields enable native `!seen` functionality.

2. **How long to keep users after QUIT?** FOREVER - Users are marked offline but kept in store. Enables address book, friends list, historical data.

3. **Should UserStore be per-server?** YES - Each server connection will have its own `UserStore`. `nihiven` on Libera.Chat is not the same as `nihiven` on EFnet.

### Future: Multi-Server Architecture

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct ServerId(usize);

pub struct Server {
    pub id: ServerId,
    pub name: String,           // "Libera.Chat"
    pub address: String,        // "irc.libera.chat:6697"
    pub user_store: UserStore,  // each server has its own users
    pub windows: WindowManager, // channels/queries for this server
}
```

This is out of scope for this branch but the design accommodates it.

## References

- Current `Nick` struct: `src/window.rs:9-61`
- Current `ChannelData`: `src/window.rs:63-85`
- Server message handlers: `src/irc/server_message_handler.rs`