# Branch: [Styling and Templates](https://github.com/nihiven/Keryx/tree/styling-and-templates) 

## Notes

As I've started to add color to Keryx, it's turning into a mess very quickly. With this branch we'll add multiple things:
    1. Text styling builder
    2. Template library/functions
    3. Some basic IRC commands to use/test basic colorization/formatting

## StyledText
I want to be able to call a function like ~~style::chan_nick(ColorScheme, Nick, Window)~~ or template::chan_nick(ColorScheme, Nick, Window) and get a formatted string. Maybe set the ColorScheme instead of passing it every call. template::set_color_scheme(ColorScheme)?  

## Templates
Each function would style a particular item such as the channel title bar/channel_title(): 
> StyledText::new(color_scheme).window_name(channel_name).text(" (").own_nick(nick).text(")").build()