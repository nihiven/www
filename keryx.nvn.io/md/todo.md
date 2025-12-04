# IRC Specs
* [Modern IRC Client Protocol](https://modern.ircdocs.horse/)
* [IRCv3 Specifications](https://ircv3.net/irc/)


## To-Do Items

### Immediate
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
    - [ ] Window Data Structures
        - [X] Window Manager
        - [X] Status
        - [X] Channel
        - [X] Query
        - [ ] Settings (later)
    - [ ] Basic Window Nav Bar (horizontal list + selection indicator)
        - [ ] Channel Bar
        - [ ] Query Bar
        - [ ] Topic Bar

### Features
- [ ] Review: https://modern.ircdocs.horse/#message-parsing-and-assembly
- [ ] Client side/app commands, such as: /exit
- [ ] Key binds
- [ ] Editbox
    - [ ] History
    - [ ] Auto-complete
    - [ ] Right Pocket
- [ ] Config window
- [ ] Styled text
- [ ] Compress like events into one line? JOIN/PART/PRIVMSG event?

### Polish
- [ ] Rust doc comments
- [ ] Review polling rate (POLLING_INTERVAL)
- [ ] Validate nick against IRC requirements

### Server Commands
- [ ] CAP
- [ ] JOIN
- [ ] MODE
- [ ] MOTD
- [ ] NICK
- [X] NOTICE
    - [ ] Setting: Always show in Active/Status
- [ ] PRIVMSG
- [ ] QUIT

### User /Commands
- [ ] CAP
- [X] JOIN
- [ ] MODE
- [ ] MOTD
- [X] NICK
- [ ] NOTICE
- [X] PRIVMSG
- [X] QUIT
- [ ] QUOTE

### RPL
- [X] 001
- [ ] 004

Skipped: 002 003

###  Pie In the Sky
- [ ] Scripting 💗
- [ ] Multiple server connections
- [ ] Themes
- [ ] SSL
