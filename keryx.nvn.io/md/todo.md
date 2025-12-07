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
    - [X] Basic Window Nav Bar (horizontal list + selection indicator)
        - [X] Channel Bar
        - [ ] Query Bar
        - [ ] Topic Bar
    - [X] Basic [JOIN](https://modern.ircdocs.horse/#join-message) parsing (user can join channels)
    - [ ] Basic [PRIVMSG](https://modern.ircdocs.horse/#privmsg-message) parsing (channel messages show in correct window)
    - [ ] Send channel messages with: /PRIVMSG, /MSG, editbox
    - [ ] Basic window switching (alt + <key> to change windows)
    - [ ] Add nick list to channel window 
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
- [ ] Timestamp
    - [ ] Formats

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
