# Branch: [windows](https://github.com/nihiven/Keryx/tree/windows)

## Notes on Window Design
Let's think through how windows will work. We can look back on this in the future to figure out why we are the way we are. Also, I've always wanted an excuse to use [ASCII Flow](https://asciiflow.com)!

## Rust Tests
I'm going to write tests as I write functionality, mostly to get some experience writing Rust tests.[]

## Questions
- [ ] How do we show multiple windows with limited space?
- [ ] What is each window's layout?
- [ ] Do we adjust layouts based on window size?
- [ ] How do we navigate between windows?
  - [ ] Alt+# to start
- [ ] How does tiling work?
- [X] What data do we need to store for each window?
- [X] Where do we show the query window list?

## Window Features
- [ ] Navigation and Info Bars
- [ ] Menus
    - [ ] Per Window
    - [ ] Customizable
- [ ] Message targeting
- [ ] Tiling

## Types of Windows
- [ ] Status - same as mIRC Status window
- [ ] #Channel - right nicklist style?
- [ ] Query - private message windows
- [ ] Keryx Settings - let user change app settings

### #Channel Window
```                                                                        
  ┌────────────────────────────── irc.keryx.rs ──────────────────────────────┐
  │ <<< 12 |  +#irc [ @#keryx ] @#miami.vice : #mIRC : #+scripting   |   >>> │
  │──────────────────────────────────────────────────────────────────────────│
  │ nihiven : Marla : !TylerDurden                                           │
  │──────────────────────────────────────────────────────────────────────────│
  │ v1.0 available! | github.com/nihiven/keryx/                  │ @Marla    │
  │──────────────────────────────────────────────────────────────│ @nihiven  │
  │                                                              │ @Samus    │
  │                                                              │ +Crockett │
  │                                                              │ +Domino   │
  │                                                              │  Dutch    │
  │                                                              │  Killian  │
  │                                                              │  Matrix   │
  │                                                              │  Richards │
  │                                                              │           │
  │                                                              │           │
  │                                                              │           │
  │ <Matrix> anyone know how to get blood out of cotton?         │           │
  │ <@nihiven> i'm trying a new soap.                            │           │
  │            its seems good so far, might work                 │           │
  │──────────────────────────────────────────────────────────────┴───────────│
  │ /commands and cool things                                                │
  └──────────────────────────────────────────────────────────────────────────┘
```                                                                                        
- Channel tab bar shows active channel as [ #channel ] and shows your mode on the channel. The arrows at the end show how many channels are to the left/right. It shows one arrow for each channel, up to three arrows. When it hits four+ channels, it shows three arrows and a number that indicates the total.
- Query tab bar shows underneath the channel tab bar when both are open.
- Nicklist is responsive. Wide when window is wide, as small as possible when window is medium, and hidden when the window is small. User can open it with some command or hotkey.
- The channel topic is shown in the main window, directly under the channel tab bar. The topic bar shares horizontal space with the nicklist because I think it makes it clear that the topic belongs to the channel.
- Channel messages and events are shown in the main window. Consecutive user messages only show the user's nick on the first message.


### Status Window
```                                                                        
  ┌────────────────────────────── irc.keryx.rs ──────────────────────────────┐
  │ keryx.Status                                                 nihiven +iw |
  │──────────────────────────────────────────────────────────────────────────│
  │ <<<       +#irc : @#keryx : @#miami.vice : #mIRC : #+scripting        >> │
  │──────────────────────────────────────────────────────────────────────────│
  │ nihiven : Marla : !TylerDurden                                           │
  │──────────────────────────────────────────────────────────────────────────│
  │                                                                          │
  │                                                                          │
  │                                                                          │
  │                                                                          │
  │                                                                          │
  │                                                                          │
  │                                                                          │
  │                                                                          │
  │                                                                          │
  │ - irc.keryx.rs - We will be upgrading to v32.3 of the Matrix this        │
  │   weekend, Sunday 1 AM EST / 4 AM. Please refrain from engaging in any   │
  │   rebelious behavior during this time. Thank you!                        │
  │──────────────────────────────────────────────────────────────────────────│
  │ /commands and cool things                                                │
  └──────────────────────────────────────────────────────────────────────────┘
```
- The channel tab bar is the same as it was in the #channel window.
- The top bar shows that you're in the Status window, along with your current nick and user modes.
- Server messages are shown in the main window.

### Query Window
```                                                                        
  ┌────────────────────────────── irc.keryx.rs ──────────────────────────────┐
  │ <<< 12 |  +#irc : @#keryx : @#miami.vice : #mIRC : #+scripting   |   >>> │
  │──────────────────────────────────────────────────────────────────────────│
  │ TylerDurden                                Away >> Out doing homework... |
  │──────────────────────────────────────────────────────────────────────────│
  │ >> So, what's up?                                                        │
  │                                                            Chillin... << │
  │ >> Cool. Want to play some ARC Raiders?                                  │
  │                      Maybe, but I need to fix a bug with keryx first. << │
  │                                                                          │
  │                                                                          │
  │                                                                          │
  │                                                                          │
  │                                                                          │
  │                                                                          │
  │                                                                          │
  │                                                                          │
  │                                                                          │
  │                                                                          │
  │──────────────────────────────────────────────────────────────────────────│
  │ /commands and cool things                                            | ! │
  └──────────────────────────────────────────────────────────────────────────┘
```   
- The query window shows the channel tab bar at the top with no active channel.
- The User bar shows the nick of the user you are private messaging with. It also shows their away status, if one is set.
- Messages are shown in the main window using the familiar left/right text messaging style.
- The right side of the editbox (right pocket?) shows an ! to indicate you have stored notes for this user.
- Questions
    - Should we show idle time too?
    - Setting to use Text Message vs Classic IRC style message history?
    - How do we display/edit stored notes?

### Settings Window
```
  ┌────────────────────────────── Settings ──────────────────────────────────┐
  │ IRC : Servers : User [ Windows ]                                         |
  │──────────────────────────────────────────────────────────────────────────│
  │ [ Channel ] Query : Status                                               │
  │──────────────────────────────────────────────────────────────────────────│
  │  [X] Show Channel Bar by default.                                        │
  │  [ ] Show Query Bar by default.                                          │
  |  [ ] Show Topic Bar by default.                                          |
  │  [X] Hide nicklist when Channel window is less than [  30  ] columns.    │
  │  [ ] Show JOIN/PART messages.                                            │
  │  [ ] Show timestamp on [ my/other's/all ] events.                        │
  │                                                                          │
  │                                                                          │
  │                                                                          │
  │                                                                          │
  │                                                                          │
  │                                                                          │
  │                                                                          │
  │                                                                          │
  │                                                                          |
  │──────────────────────────────────────────────────────────────────────────│
  │ /commands and cool things                              | [ Save ] Cancel │
  └──────────────────────────────────────────────────────────────────────────┘
  ```
- Top bar is the Category Bar, bottom bar is the Function(?) Bar. With categories being groups and functions being the settings for individual items within the group.
- Save/Cancel buttons show in our little right pocket!


## Widgets

### Channel Bar
This allows the user to scroll through and move between the channels they've joined. The text has three (left/center/right) alignments, depending on where the user is in the list. The arrows at the end show how many channels are to the left/right, one arrow for each channel, up to three arrows. When it hits four+ channels, it shows three arrows and a number that indicates the total. In the examples below, the user is on the following 10 channels:
- #3dprinting #audiofile #ARCRaiders #irc #keryx #miami.vice #mirc #scripting #takemeback #weylandyutani

**Left Aligned/Beginning of List**
```
  │──────────────────────────────────────────────────────────────────────────│
  │ [ #3dprinting ] #audiofile : #ARCRaiders : +#irc : @#keryx       | 5 >>> │
  │──────────────────────────────────────────────────────────────────────────│
```

**Centered/Scrolled**
```
  │──────────────────────────────────────────────────────────────────────────│
  │ <<<       +#irc : @#keryx [ @#miami.vice ] #mIRC : #+scripting        >> │
  │──────────────────────────────────────────────────────────────────────────│
```

**Right Aligned/End of List**
```
  │──────────────────────────────────────────────────────────────────────────│
  │ <<< 5 | #miami.vice : #mIRC : #+scripting [ #takemeback ] #weylandyutani │
  │──────────────────────────────────────────────────────────────────────────│
```

- [ ] How do we show user has the channel highlighted vs selected?

### Query Bar
### Topic Bar
### User Bar
### Editbox
The editbox allows the user to type and paste text. It also has a right aligned multi-use 'widget' (known as the right pocket?), which can:
- Show user alerts: Friend alerts? Invites? Mentions?
- Allow for additional areas of input: Ok/Cancel buttons
- Show the user misc information: Leet MP3 messages? 

**Standard**
```
│──────────────────────────────────────────────────────────────────────────│
│ /commands and cool things                                                │
└──────────────────────────────────────────────────────────────────────────┘
```

**Alerts**
```
│──────────────────────────────────────────────────────────────────────────│
│ /commands and cool things                                            | ! │
└──────────────────────────────────────────────────────────────────────────┘
```

**Buttons**
```
│──────────────────────────────────────────────────────────────────────────│
│ /commands and cool things                              | [ Save ] Cancel │
└──────────────────────────────────────────────────────────────────────────┘
```