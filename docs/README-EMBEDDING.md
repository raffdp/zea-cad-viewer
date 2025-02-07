# Embedding the Zea CAD Viewer in your own Web App

## Embed View

The Embed view shows how the zea-cad-viewer would be displayed within the context of another application, embedded as an iFrame. The host application can then control the embedded zea-cad-viewer via the JSON API and the Channel Messenger classes.

# Getting Started

To test zea-cad-viewer embedded on your system, and follow the following steps.

# Add the iframe tag.

Add an iframe tag to your application, and specify the URL of the viewer.

```html
<iframe
  id="zea-cad-viewer"
  src="https://cad-viewer-staging.zea.live/?embedded"
></iframe>
```

# Connect the Channel Messenger.

Using JavaScript, import the ChannelMessenger and construct an instance passing the iframe tag.

```html
<script type="module">
  import { ChannelMessenger } from 'https://docs.zea.live/zea-cad-viewer/ChannelMessenger.js'

  const viewer = document.getElementById('zea-cad-viewer')

  const client = new ChannelMessenger(viewer)
  client.on('ready', (data) => {
    logger.log('Ready')
  })
</script>
```

The ChannelMessenger establishes a connection to the viewer, which allows the host application to send commands to the viewer, and receive events and data back from the viewer.

## Commands

The ChannelMessenger enables a host application to send arbitrary commands to the embed window and receive data in response.

### events vs send & get commands

Commands fall into 3 categories, 'event', 'send' and 'get'.

#### Events

Events are receive data from the embed page and are used to push data from the embed to the host. This could include telling the host that the used has clicked on a specific geometry.

To implement an event, when the event must be related to the host, simply send the event over the channel messenger.

##### In the Svelte App code

```javascript
  // After 20 seconds, we tell the user something..
  setTimout(() => {
    client.send('gameOver', { info: ... })
  }, 20000)
```

##### In the Host App code

In your host application, you listen for this event using the channel messenger. You can then handle the event how you wish.

```javascript
client.on('somethingChanged', (data) => {
  console.log('selectionChanged:', data)
})
```

Within the zea-cad-viewer code, you can add support for your own commands by adding handlers for various command names.

#### Send Commamds

Used to send a command from the host page to the embed page, but a response is not expected.

##### In the Svelte App code

So implement a 'send' command, simply add code to the zea-cad-viewer that listens for your specific message, and implement some logic.

```javascript
  client.on('changeSomething', (data) => {
    // The host wants us to change something. Lets do it.
    ....
    // Return a simple 'done' value to let the host know that it completed.
    if (data._id) {
      client.send(data._id, { done: true })
    }
  })
```

##### In the Host App code

Then in your host application, you can now invoke the command using the channel messenger.

```javascript
client.do('changeSomething', { arg: 'Important Info' })
```

The zea-cad-viewer will receive the message and apply the requested changes.

# JSON API

The zea-cad-viewer accepts a range of commands sent via the ChannelMessenger interface. These commands represent a sample set of commands for you to check out and use to base your own commands.

## Events

The Svelte App might emit events based on interactions within the viewer or other reasons. The host web application can listen to these events and respond.

#### Ready

The ready event is sent as soon as the zea-cad-viewer frame has loaded, and the ChannelMessenger has established a connection with the page.

```javascript
client.on('ready', (data) => {
  console.log('zea-cad-viewer is ready to load data')
})
```

#### selectionChanged

The selectionChanged event is sent when the selection changes in the selection manager in the app.

```javascript
client.on('selectionChanged', (data) => {
  console.log('selectionChanged:', data)
})
```

## Commands

The commands are structured in the following way.

> Command Name: The command name is a string describing which command should be invoked in the viewer.
> Payload: The payload is a json structure containing relevant information needed to process the command.
> Results: Each command returns a promise that resolves to some result returned by the zea-cad-viewer

```javascript
do('command-name', payload).then((results) => {
  // process or display the results.
})
```

#### Load Data

```javascript
client
  .do('loadCADFile', {
    url: '../foo.zcad',
    addToCurrentScene: false,
  })
  .then((data) => {
    console.log('loadCADFile Loaded', data)
  })
```

##### Payload:

zcad: the URL of the zcad accessible to the app.
addToCurrentScene: If set to true, adds the new file to the scene containing the existing file. Else the scene is cleared and the new file is loaded.
convertZtoY: If the data coordinates expected 'Y' up, this parameter rotates the model to correctly orient the data according to the viewer axis system.

##### Results:

The command returns a JavaScript object containing high level data about the loaded project.

#### Get Model Structure

Retrieves the model structure of the loaded data.

```javascript
client.do('getModelStructure', {}).then((data) => {
  console.log('model structure:', data)
})
```

##### Results:

The command returns a JavaScript object containing high level data about the loaded project.

#### Set Background Color

Sets the background color of the viewport.

```javascript
client.do('setBackgroundColor', { color: '#FF0000' })
```

#### Set Highlight Color

Sets the color used to provide silhouette borders around selected objects.

```javascript
client.do('setHighlightColor', { color: '#FF0000' })
```

#### Set Render Mode

Sets the render mode currently used by the renderer.

Possible Values are:

- "WIREFRAME"
- "FLAT"
- "HIDDEN_LINE"
- "SHADED"
- "PBR"(default)

```javascript
client.do('setRenderMode', { mode: 'FLAT' })
```

#### Set Camera Manipulation Mode

Sets the method used to manipulate the view.

Possible Values are:

- "TURNTABLE": Better for scenes where the user should always be vertical in the scene. e.g. architectural scenes, or large CAD models.
- "TUMBLER"(default): Better for scenes were the user wants to look at the data from any point of view, including upside down, and the 'up' direction isn't important to the user.
- "TRACKBALL" Better for scenes were the user wants to look at the data from any point of view, including upside down, and the 'up' direction isn't important to the user.

```javascript
client.do('setCameraManipulationMode', { mode: 'TURNTABLE' })
```
