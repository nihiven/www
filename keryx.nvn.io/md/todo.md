# IRC Specs
* [Modern IRC Client Protocol](https://modern.ircdocs.horse/)
* [IRCv3 Specifications](https://ircv3.net/irc/)
* [Effective Rust](https://effective-rust.com/title-page.html)

# TOC
* [Immediate Items](#immediate)
* [Planned Features](#planned)
* [Server Commands](#server_cmd)
* [User Commands](#user_cmd)
* [Wishlist](#wishlist)
* [Bugs](#bugs)

## To-Do Items

### <a name="immediate"></a>Immediate
- [X] Create app structure
- [X] Handle errors
- [X] Handle logging
- [X] Create event handling
- [X] Handle keyboard events
- [X] Create terminal
- [X] Draw first terminal layout and text
- [X] Scroll terminal when required
- [X] Open connection to IRC server
- [X] Respond to PING
- [X] Join a channel
- [X] Basic server->client message parsing
- [X] Extract NICK from parsed IRCMessage
- [X] Show NICK in window title
- [X] Display NOTICEs
- [X] Input box / handle Enter keypress
- [X] Basic client->server command processing
- [X] Baby's first Rust tests
- [X] Map /commands to Rust functions
- [X] [Multiple windows / branch: windows](/branch/windows-001.md)
    - [X] Window Data Structures
        - [X] Window Manager
        - [X] Status
        - [X] Channel
        - [X] Query
    - [X] Basic Window Nav Bars (horizontal list + selection indicator)
        - [X] Channel Bar
        - [ ] Query Bar
    - [X] Basic [JOIN](https://modern.ircdocs.horse/#join-message) parsing (user can join channels)
    - [X] Basic [PRIVMSG](https://modern.ircdocs.horse/#privmsg-message) parsing (channel/query messages show in correct window)
    - [X] Basic window switching (alt + <key> to change windows)
    - [X] Close windows: /close + /part
    - [X] Tests + Bug Fixes + clippy
        - [X] Case-insensitive window name matching
        - [X] Stop sending Action::None to main loop
- [X] Refactor message/command code in main
- [X] Send channel messages with: /PRIVMSG, /MSG, editbox
- [X] Timestamp (basic)
- [X] Editbox cursor (basic)
- [ ] Add nick list to channel window
    - [X] Update window to hold channel data
    - [X] Handle 353 and 366
    - [ ] Draw nicklist!
    - [ ] TESTS

### <a name="planned"></a>Planned Items
- [ ] Review: https://modern.ircdocs.horse/#message-parsing-and-assembly
- [ ] Bar API
    - [ ] Multiple Types
    - [ ] Activity Indicators
    - [ ] Custom key bindings
    - [ ] show user's mode on channels: | : Status : @#keryx [ +#irc ] #rust : #flac : | 
- [ ] Key binds
- [ ] Editbox
    - [ ] Auto-complete
    - [ ] Right Pocket
    - [ ] Proper cursor movement and text selection
- [ ] Styled text
- [ ] Timestamp
    - [ ] format
    - [ ] show hide
    - [ ] 12 or 24 hour
- [ ] Message Formatting
    - [ ] Events: JOIN, PART, NOTICE
    - [ ] Timestamp
- [ ] Channel Window
    - [ ] PRIVMSG: Show users' channel mode (op, voice)
    - [ ] Topic bar
    - [ ] Nicklist
    - [ ] Compress like events into one line? JOIN/PART/PRIVMSG event?
- [ ] Settings
    - [ ] API
    - [ ] Window
- [ ] History
    - [ ] Channel
    - [ ] Editbox
    - [ ] Query
- [ ] Polish
    - [ ] Rust doc comments
    - [ ] Review polling rate (POLLING_INTERVAL)
    - [ ] Validate nick against IRC requirements
    - [ ] On window close, activate window to the Left in the list, instead of Status. Setting?
    - [ ] Rejoin open channels on connect. Setting?
    - [ ] Redraw on console resize
- [ ] Log\Feedback
    - [ ] Need to be able to specify window with WindowManager.log (or add fns): Status/active/target
- [ ] RPL_ISUPPORT
    - [ ] User Modes
- [ ] ratatui-image

### <a name="server_cmd"></a>Server Commands
- [ ] ACTION (/me)
- [ ] CAP
- [ ] [CTCP](https://rawgit.com/DanielOaks/irc-rfcs/master/dist/draft-oakley-irc-ctcp-latest.html)
- [ ] [JOIN](https://modern.ircdocs.horse/#join-message)
    - [ ] RPL_TOPIC (332)
        - [ ] Topic Bar
    - [ ] RPL_TOPICWHOTIME (333)
    - [ ] RPL_NAMREPLY (353)
    - [ ] RPL_ENDOFNAMES (366)
    - [ ] Errors
        - [ ] ERR_NEEDMOREPARAMS (461)
        - [ ] ERR_NOSUCHCHANNEL (403)
        - [ ] ERR_TOOMANYCHANNELS (405)
        - [ ] ERR_BADCHANNELKEY (475)
        - [ ] ERR_BANNEDFROMCHAN (474)
        - [ ] ERR_CHANNELISFULL (471)
        - [ ] ERR_INVITEONLYCHAN (473)
        - [ ] ERR_BADCHANMASK (476)
- [ ] MODE
- [ ] MOTD
- [ ] NICK
- [X] NOTICE
    - [ ] Setting: Always show in Active/Status
- [ ] PART
    - [X] Basic handling
- [ ] PRIVMSG
- [ ] QUIT

### <a name="user_cmd"></a>User /Commands
- [ ] ACTION (/me)
- [ ] CAP
- [X] CLOSE
- [ ] [CTCP](https://rawgit.com/DanielOaks/irc-rfcs/master/dist/draft-oakley-irc-ctcp-latest.html)
- [ ] ECHO
- [X] [JOIN](https://modern.ircdocs.horse/#join-message)
- [ ] MODE
- [ ] MOTD
- [X] NICK
- [ ] NOTICE
- [X] PART
- [X] PRIVMSG
- [X] QUIT
- [ ] QUOTE

### RPL
- [X] 001
- [ ] 004

Skipped: 002 003

###  <a name="wishlist"></a>Wishlist
- [ ] Scripting 💗
- [ ] Multiple server connections
- [ ] Themes
- [ ] SSL
- [ ] Music player integration? (foobar)

## <a name="bugs"></a>Bugs

**[Can't Reproduce]** 'Rejoined' message displays when joining a channel.
```
INPUT >> /join #keryx
Joined #keryx
:ab35ab9ad3e7.example.com 353 nKeryxTest = #keryx :@nKeryxTest
:ab35ab9ad3e7.example.com 366 nKeryxTest #keryx :End of /NAMES list.
INPUT >> test
Rejoined #keryx
```

Should we show our own messages twice in Query window? Server + echo?


## Old Branch Notes
[windows-001](/branch/windows-001.md): add WindowManager and supporting code