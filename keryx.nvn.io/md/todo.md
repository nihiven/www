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
- [ ] [Multiple windows / branch: windows](/branch/windows-001.md)
    - [ ] Window Data Structures
        - [X] Window Manager
        - [X] Status
        - [X] Channel
        - [X] Query
    - [X] Basic Window Nav Bars (horizontal list + selection indicator)
        - [X] Channel Bar
        - [ ] Query Bar
    - [X] Basic [JOIN](https://modern.ircdocs.horse/#join-message) parsing (user can join channels)
    - [ ] Basic [PRIVMSG](https://modern.ircdocs.horse/#privmsg-message) parsing (channel/query messages show in correct window)
    - [ ] Basic window switching (alt + <key> to change windows)
- [ ] Post windows branch
    - [ ] Send channel messages with: /PRIVMSG, /MSG, editbox
    - [ ] Add nick list to channel window 


### Features
- [ ] Review: https://modern.ircdocs.horse/#message-parsing-and-assembly
- [ ] Client side/app commands, such as: /exit
- [ ] Key binds
- [ ] Editbox
    - [ ] History
    - [ ] Auto-complete
    - [ ] Right Pocket
- [ ] Styled text
- [ ] Timestamp
- [ ] Message Formatting
    - [ ] Events: JOIN, PART, NOTICE
    - [ ] Timestamp
- [ ] Channel Window
    - [ ] PRIVMSG: Show users' channel mode (op, voice)
    - [ ] Topic bar
    - [ ] Nicklist
    - [ ] Compress like events into one line? JOIN/PART/PRIVMSG event?
- [ ] Settings
    - API
    - Window

### Polish
- [ ] Rust doc comments
- [ ] Review polling rate (POLLING_INTERVAL)
- [ ] Validate nick against IRC requirements
- [ ] Nav bar refactor

### Server Commands
- [ ] CAP
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
