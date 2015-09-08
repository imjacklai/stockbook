var app = require("app");
var BrowserWindow = require("browser-window");
var mainWindow = null;

app.on("window-all-closed", function() {
  if (process.platform != "darwin") {
    app.quit();
  }
});

app.on("ready", function() {
  var screen = require("screen");
  var size = screen.getPrimaryDisplay().workAreaSize;
  mainWindow = new BrowserWindow({
    width: size.width,
    height: size.height,
    center: true
  });
  mainWindow.loadUrl("file://" + __dirname + "/index.html");
  // mainWindow.openDevTools();

  mainWindow.on("close", function() {
    mainWindow = null;
  });
});