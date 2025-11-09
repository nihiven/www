# Keryx - TUI IRC Client - Implementation TODO

This document tracks the implementation progress for Keryx, a TUI IRC client built with rust using ratatui.

## IRC Specs
[Modern IRC Client Protocol](https://modern.ircdocs.horse/)
[IRCv3 Specifications](https://ircv3.net/irc/)

## Architecture Overview

**Pattern**: Elm Architecture (TEA)
- **Model** ([src/app.rs](src/app.rs)) - All application state
- **Update** ([src/update.rs](src/update.rs)) - State transitions based on Actions
- **View** ([src/ui/render.rs](src/ui/render.rs)) - Pure rendering functions

**Async Structure**:
- Main event loop in [src/main.rs](src/main.rs)
- IRC client runs in separate async task ([src/irc/client.rs](src/irc/client.rs))
- Input handler runs in separate async task ([src/events.rs](src/events.rs))
- Communication via tokio mpsc channels using Actions

---

## ✅ Completed

- [x] Project structure created
- [x] Dependencies added to Cargo.toml
- [x] Skeleton files with documentation and guidance comments

---

## 📋 Implementation Checklist

### Phase 1: Core Application State

#### [src/app.rs](src/app.rs) - Application State
- [ ] Define `App` struct with all application state
  - [ ] Connection state (connected, server, nickname)
  - [ ] IRC data (channels HashMap, current_channel)
  - [ ] UI state (input_buffer, scroll_offset, focus)
  - [ ] Application control (should_quit)
- [ ] Define `Channel` struct
  - [ ] name, messages, users, topic, unread_count
- [ ] Define `Message` struct
  - [ ] timestamp, sender, content, kind
- [ ] Define `MessageKind` enum
  - [ ] Normal, Action, Join, Part, Quit, Notice, Error
- [ ] Define `Focus` enum
  - [ ] ChannelList, MessageView, Input, UserList
- [ ] Implement `App::new()` constructor
- [ ] Implement channel management methods
  - [ ] `add_channel()`
  - [ ] `remove_channel()`
  - [ ] `get_current_channel()`
  - [ ] `switch_channel()`
  - [ ] `add_message()`

#### [src/action.rs](src/action.rs) - Events/Actions
- [ ] Define `Action` enum with all variants
  - [ ] IRC Events (IrcMessage, UserJoined, UserParted, etc.)
  - [ ] User Input (KeyPress, SendMessage, SendCommand)
  - [ ] UI Actions (ScrollUp, ScrollDown, SwitchChannel, etc.)
  - [ ] Application Control (Connect, Disconnect, Quit)
- [ ] Implement helper methods if needed
  - [ ] `requires_redraw()`

### Phase 2: Core Logic

#### [src/update.rs](src/update.rs) - State Update Logic
- [ ] Implement main `update(app, action)` function
- [ ] Handle IRC events
  - [ ] IrcMessage - add to channel, increment unread
  - [ ] UserJoined/Parted - update user list, add system message
  - [ ] ChannelJoined - add channel, set as current
  - [ ] ConnectionEstablished/Lost - update connection state
- [ ] Handle user input
  - [ ] KeyPress - delegate to key handler
  - [ ] SendMessage - parse commands vs messages
  - [ ] SendCommand - execute IRC commands
- [ ] Handle UI actions
  - [ ] ScrollUp/Down - update scroll_offset
  - [ ] SwitchChannel - change current_channel
  - [ ] NextChannel/PreviousChannel - cycle through channels
- [ ] Implement helper functions
  - [ ] `handle_key_press()` - keyboard input routing
  - [ ] `handle_send_message()` - command parsing
  - [ ] `handle_command()` - IRC command execution (/join, /part, /quit, etc.)

#### [src/config.rs](src/config.rs) - Configuration
- [ ] Define `Config` struct
- [ ] Define `ServerConfig` struct
- [ ] Define `UserConfig` struct
- [ ] Define `UiConfig` struct
- [ ] Define `Theme` struct
- [ ] Define `KeyBindings` struct
- [ ] Implement `Config::load()` - load from file
- [ ] Implement `Config::save()` - save to file
- [ ] Implement `Config::get_config_path()` - cross-platform path
- [ ] Implement `Default` trait for all config structs

### Phase 3: Terminal & Events

#### [src/tui.rs](src/tui.rs) - Terminal Setup
- [ ] Define `Tui` type alias
- [ ] Implement `init()` function
  - [ ] Install panic hook
  - [ ] Enable raw mode
  - [ ] Enter alternate screen
  - [ ] Create Terminal instance
- [ ] Implement `restore()` function
  - [ ] Leave alternate screen
  - [ ] Disable raw mode
- [ ] Implement `install_panic_hook()` - cleanup on panic

#### [src/events.rs](src/events.rs) - Event Handling
- [ ] Implement `handle_events()` async task
  - [ ] Poll for terminal events
  - [ ] Convert events to Actions
  - [ ] Send Actions through channel
- [ ] Implement `convert_event()` - map crossterm events to Actions
- [ ] Alternative: Implement async event stream version

#### [src/main.rs](src/main.rs) - Main Entry Point
- [ ] Uncomment module declarations
- [ ] Implement `main()` function with tokio async runtime
  - [ ] Initialize error handling (color-eyre)
  - [ ] Setup logging to file (tracing)
  - [ ] Create mpsc channels for Actions
  - [ ] Initialize terminal
  - [ ] Create App instance
  - [ ] Spawn IRC client task
  - [ ] Spawn input event handler task
  - [ ] Main event loop
    - [ ] Render UI
    - [ ] Receive Actions
    - [ ] Update state
    - [ ] Check for quit
  - [ ] Cleanup terminal on exit

### Phase 4: IRC Integration

#### [src/irc/message.rs](src/irc/message.rs) - Message Types
- [ ] Define `ParsedMessage` struct
- [ ] Define `MessageKind` enum (if not in app.rs)
- [ ] Implement `ParsedMessage::from_irc_message()`
- [ ] Implement `parse_action()` - CTCP ACTION parsing
- [ ] Implement helper functions
  - [ ] `extract_nickname()` - parse nick from hostmask
  - [ ] `mentions_nickname()` - check for mentions
  - [ ] `format_with_timestamp()` - format message for display
  - [ ] `format_action()` - format /me action
  - [ ] `format_system()` - format system messages

#### [src/irc/connection.rs](src/irc/connection.rs) - Connection Management
- [ ] Define `ConnectionManager` struct
- [ ] Define `ConnectionState` enum
- [ ] Implement `ConnectionManager::new()`
- [ ] Implement `connect()` - establish connection
- [ ] Implement `handle_disconnect()` - handle lost connection
- [ ] Implement `reconnect()` - reconnect with exponential backoff
- [ ] Implement `is_healthy()` - connection health check
- [ ] Implement `update_ping()` - track PING times
- [ ] Implement `reset()` - reset connection state
- [ ] Implement `parse_server_address()` - parse host:port

#### [src/irc/client.rs](src/irc/client.rs) - IRC Client
- [ ] Define `IrcClient` struct
- [ ] Define `IrcCommand` enum
  - [ ] Connect, Disconnect, JoinChannel, PartChannel, SendMessage, ChangeNickname, Quit
- [ ] Implement `IrcClient::new()`
- [ ] Implement `run()` - main async task loop
  - [ ] Use tokio::select! to handle IRC messages and commands
- [ ] Implement `handle_message()` - process incoming IRC messages
  - [ ] PRIVMSG -> Action::IrcMessage
  - [ ] JOIN -> Action::UserJoined
  - [ ] PART -> Action::UserParted
  - [ ] QUIT -> Action::UserQuit
  - [ ] PING -> Send PONG
  - [ ] 001 (RPL_WELCOME) -> Action::ConnectionEstablished
- [ ] Implement `handle_command()` - execute IRC commands
  - [ ] JoinChannel, PartChannel, SendMessage, etc.
- [ ] Implement `spawn()` - convenience function to spawn client task

#### [src/irc/mod.rs](src/irc/mod.rs)
- [ ] Uncomment and export all submodules

### Phase 5: UI Rendering

#### [src/ui/layout.rs](src/ui/layout.rs) - Layout Calculations
- [ ] Define `LayoutChunks` struct
- [ ] Implement `calculate_main_layout()` - main 3-column layout
- [ ] Implement `calculate_compact_layout()` - for small terminals
- [ ] Implement `calculate_maximized_layout()` - maximize message area
- [ ] Implement `calculate_responsive_layout()` - auto-select based on size

#### [src/ui/render.rs](src/ui/render.rs) - Main Render
- [ ] Implement `render()` function
  - [ ] Calculate layout
  - [ ] Render each component
- [ ] Alternative: Implement `render_inline()` with direct layout

#### [src/ui/components/channel_list.rs](src/ui/components/channel_list.rs) - Channel List
- [ ] Implement `render()` function
  - [ ] Create ListItems from channels
  - [ ] Highlight current channel
  - [ ] Show unread indicators
  - [ ] Create List widget with borders
- [ ] Implement `render_stateful()` - with scrolling support
- [ ] Implement helper functions
  - [ ] `format_channel_name()` - add indicators
  - [ ] `get_channel_style()` - style based on state

#### [src/ui/components/message_view.rs](src/ui/components/message_view.rs) - Message View
- [ ] Implement `render()` function
  - [ ] Get current channel messages
  - [ ] Format messages as Lines
  - [ ] Create Paragraph widget
  - [ ] Handle no channel selected state
- [ ] Implement `format_message()` - style messages by type
  - [ ] Normal messages
  - [ ] Action messages (/me)
  - [ ] System messages (join/part/quit)
  - [ ] Notices
  - [ ] Errors
- [ ] Implement `render_with_scrollbar()` - add scrollbar
- [ ] Implement helper functions
  - [ ] `highlight_mentions()` - highlight nickname mentions
  - [ ] `highlight_urls()` - highlight URLs
  - [ ] `calculate_visible_messages()` - fit to area

#### [src/ui/components/input.rs](src/ui/components/input.rs) - Input Box
- [ ] Implement `render()` - simple version
  - [ ] Format input with cursor
  - [ ] Style based on command vs message
  - [ ] Create Paragraph widget
- [ ] Implement `render_textarea()` - using tui-textarea
- [ ] Implement input handling functions
  - [ ] `handle_char_input()` - character insertion
  - [ ] `handle_backspace()` - delete character
  - [ ] `handle_enter()` - submit message
- [ ] Implement `InputHistory` struct
  - [ ] `new()` - create with max size
  - [ ] `add()` - add message to history
  - [ ] `previous()` - go back (up arrow)
  - [ ] `next()` - go forward (down arrow)
- [ ] Implement `parse_command()` - parse IRC commands

#### [src/ui/components/user_list.rs](src/ui/components/user_list.rs) - User List
- [ ] Define `UserMode` enum
  - [ ] Owner, Admin, Op, HalfOp, Voice, Normal
  - [ ] Implement `prefix()` - get prefix character
  - [ ] Implement `color()` - get color for mode
- [ ] Implement `render()` function
  - [ ] Get current channel users
  - [ ] Sort by mode
  - [ ] Create ListItems with mode colors
  - [ ] Create List widget
- [ ] Implement helper functions
  - [ ] `parse_user_mode()` - extract mode from nickname
  - [ ] `strip_mode_prefix()` - remove prefix
  - [ ] `sort_users()` - sort by mode then alphabetically

#### [src/ui/components/status_bar.rs](src/ui/components/status_bar.rs) - Status Bar
- [ ] Implement `render()` function
  - [ ] Show connection status (connected/disconnected)
  - [ ] Show server name
  - [ ] Show current channel
  - [ ] Show user count
  - [ ] Show help text
- [ ] Implement `render_sectioned()` - three-section layout
  - [ ] Left: Connection status
  - [ ] Center: Channel info
  - [ ] Right: Stats and help
- [ ] Implement helper functions
  - [ ] `get_connection_icon()` - ● vs ○
  - [ ] `get_connection_color()` - green vs red
  - [ ] `format_duration()` - format uptime

#### [src/ui/components/mod.rs](src/ui/components/mod.rs)
- [ ] Uncomment and export all component modules

#### [src/ui/mod.rs](src/ui/mod.rs)
- [ ] Uncomment and export all UI modules

---

## Phase 6: Testing & Polish

### Testing
- [ ] Test basic connection to IRC server
- [ ] Test joining and parting channels
- [ ] Test sending and receiving messages
- [ ] Test user list updates
- [ ] Test UI navigation (switching channels, scrolling)
- [ ] Test input history
- [ ] Test IRC commands (/join, /part, /quit, /msg, /nick)
- [ ] Test reconnection logic
- [ ] Test configuration loading/saving
- [ ] Test error handling

### Polish
- [ ] Add more color themes
- [ ] Improve error messages
- [ ] Add more IRC commands support
- [ ] Add notification support for mentions
- [ ] Add timestamp formatting options
- [ ] Add URL detection and opening
- [ ] Add nick tab completion
- [ ] Add channel name completion
- [ ] Add command completion
- [ ] Add help system (/help command)
- [ ] Add logging system (separate from TUI)
- [ ] Performance optimization for large channels
- [ ] Handle very long messages
- [ ] Add TLS/SSL support
- [ ] Add SASL authentication
- [ ] Add multi-server support (optional)

### Documentation
- [ ] Write README.md with usage instructions
- [ ] Document configuration file format
- [ ] Document keybindings
- [ ] Document IRC commands
- [ ] Add screenshots/examples

---

## 🎯 Quick Start Implementation Order

**Recommended order for fastest working prototype:**

1. **Basic State** - Implement core types in `app.rs` and `action.rs`
2. **Terminal Setup** - Get `tui.rs` working to show something on screen
3. **Simple Render** - Basic UI layout and one component (e.g., status bar)
4. **Event Loop** - Wire up `main.rs` event loop without IRC
5. **Input Handling** - Get keyboard input working
6. **Mock IRC** - Add fake messages to test UI
7. **Real IRC** - Integrate actual IRC client
8. **Polish** - Add remaining features and improvements

---

## 📚 Key Dependencies Documentation

- [ratatui](https://docs.rs/ratatui/) - TUI framework
- [crossterm](https://docs.rs/crossterm/) - Terminal manipulation
- [tokio](https://docs.rs/tokio/) - Async runtime
- [irc](https://docs.rs/irc/) - IRC protocol library
- [tui-textarea](https://docs.rs/tui-textarea/) - Text input widget
- [color-eyre](https://docs.rs/color-eyre/) - Error handling

---

## 💡 Tips

- Start with the `examples/tui_hello.rs` file to see a working ratatui example
- Test each component independently before integrating
- Use logging (`tracing`) to debug - don't print to stdout (corrupts TUI)
- Handle errors gracefully - always restore terminal on panic
- Keep the main event loop simple - complex logic goes in `update.rs`
- Use `tokio::select!` to handle multiple async streams efficiently

---

## 📝 Notes

- All files contain detailed TODO comments with implementation guidance
- The architecture follows the Elm Architecture (TEA) pattern for predictability
- Each component is isolated and can be developed/tested independently
- The IRC client runs asynchronously, separate from the UI loop
