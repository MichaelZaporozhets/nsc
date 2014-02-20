var app = module.exports = require('appjs');


app.serveFilesFrom(__dirname + '/content');

var menubar = app.createMenu([{
  label:'&File',
  submenu:[
    {
      label:'E&xit',
      action: function(){
        window.close();
      }
    }
  ]
},{
  label:'&Window',
  submenu:[
    {
      label:'Fullscreen',
      action:function(item) {
        window.frame.fullscreen();
        console.log(item.label+" called.");
      }
    },
    {
      label:'Minimize',
      action:function(){
        window.frame.minimize();
      }
    },
    {
      label:'Maximize',
      action:function(){
        window.frame.maximize();
      }
    },{
      label:''//separator
    },{
      label:'Restore',
      action:function(){
        window.frame.restore();
      }
    }
  ]
}]);

// var trayMenu = app.createMenu([{
//   label:'Show',
//   action:function(){
//     window.frame.show();
//   },
// },{
//   label:'Minimize',
//   action:function(){
//     window.frame.hide();
//   }
// },{
//   label:'Exit',
//   action:function(){
//     window.close();
//   }
// }]);

// var statusIcon = app.createStatusIcon({
//   icon:'./data/content/icons/32.png',
//   tooltip:'AppJS Hello World',
//   menu:trayMenu
// });

var window = app.createWindow({
  width  : 640,
  height : 640,
  icons  : __dirname + '/content/icons',
  showChrome : true,
  alpha: true,
  autoResize: false,
  resizable: true,
  margin: 0
});

window.on('create', function(){
  console.log("Window Created");
  window.frame.show();
  window.frame.center();
});
window.on('ready', function(){
  window.process = process;
  window.module = module;

  function F12(e){ return e.keyIdentifier === 'F12' }
  function Command_Option_J(e){ return e.keyCode === 74 && e.metaKey && e.altKey }
  function Command_Q(e){ return e.keyCode === 81 && e.metaKey }

  window.addEventListener('keydown', function(e){
    if (F12(e) || Command_Option_J(e)) {
      window.frame.openDevTools();
    }
  });
   window.addEventListener('keydown', function(e){
    if (F12(e) || Command_Q(e)) {
      window.close();
    }
  });
});