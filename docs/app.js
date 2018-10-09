let viewerDiv = document.getElementById('forgeViewer');
let viewer;
let models = [];
let red = new THREE.Vector4(1, 0, 0, 1);
let initViewState = {"viewport":{"name":"","eye":[-54.04144748305629,9.986069098325615,58.76530477999492],"target":[-53.98315495280433,9.993269563869807,58.6843712990803],"up":[0.8032264158174367,0.09921689976883957,0.5873528170812959],"worldUpVector":[0,0,1],"pivotPoint":[33.30302047729492,33.71148109436035,-5.149933815002441],"distanceToOrbit":104.35197687479128,"aspectRatio":1.9362279511533242,"projection":"perspective","isOrthographic":false,"fieldOfView":75.35774349012831},"renderOptions":{"environment":"Sharp Highlights","ambientOcclusion":{"enabled":true,"radius":12.989516198435968,"intensity":0.5},"toneMap":{"method":1,"exposure":-9,"lightMultiplier":-1e-20},"appearance":{"ghostHidden":true,"ambientShadow":true,"antiAliasing":true,"progressiveDisplay":true,"swapBlackAndWhite":false,"displayLines":true,"displayPoints":false}},"cutplanes":[]};
const avd = Autodesk.Viewing.Document;
window.devicePixelRatio = 1.25;

var getForgeToken = function(onSuccess) {
    fetch(`https://0rwcyzgoj9.execute-api.us-east-1.amazonaws.com/vrokit/api/token`)
      .then(r => r.json()).then( res => {
        onSuccess( res.access_token, res.expires_in );
    });
}


var options = {
	urn1 : 'urn:' + "dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6dnJwYXJ0eTEvcmFjX2FsbHZpZXdzMy5ydnQ",
	urn2 : 'urn:' + "dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6dnJwYXJ0eTEvRG9nX0hvdXNlXzIwMTZfQ2xhc3NpZmllZF9XaXRoTWF0ZXJpYWxUZXh0dXJlLmR3Zg",
	getAccessToken: getForgeToken,
	env: 'AutodeskProduction',
};


/**
 * Autodesk.Viewing.Document.load() success callback.
 * Proceeds with model initialization.
 */

function onLoadModelSuccess(model) {
    models.push(model);

    // load next model into scene
    if (models.length==1) {
	    avd.load( options.urn2, onDocumentLoadSuccess );
	    viewer.restoreState(initViewState);
	}
}

function onDocumentLoadSuccess(doc) {
  // A document contains references to 3D and 2D viewables.
  var viewables = avd.getSubItemsWithProperties(doc.getRootItem(), {'type': 'geometry', 'role': '3d'}, true);
  if (viewables.length === 0) return;
  var initialViewable = viewables[0];
  var svfUrl = doc.getViewablePath(initialViewable);
  var modelOptions = { sharedPropertyDbPath: doc.getPropertyDbPath() };
  viewer.loadModel(svfUrl, modelOptions, onLoadModelSuccess);
}


function initializeViewer() {
    Autodesk.Viewing.Initializer(options, function onInitialized() {
      viewer = new Autodesk.Viewing.Private.GuiViewer3D(viewerDiv);
      viewer.setTheme("light-theme");
      var errorCode = viewer.start();
      avd.load( options.urn1, onDocumentLoadSuccess );
    });
}






/**
 * Multi-model features
 */

function resetView() {
    models.map( model => viewer.clearThemingColors(model) );
    viewer.impl.visibilityManager.aggregateIsolate([]);
}

// Example: select isolated values:
function getSpecialSelection() {
    // Getting selected IDs
    var DBids = viewer.impl.selector.getAggregateSelection(); // Special case to handle multi-model selection
    DBids = DBids.map( a=> {return a.selection});  // filter out the model objects
    console.log(JSON.stringify(DBids));
}

// Example: set isolate for multi-model
function setIsolationIds(clashArr) {
    viewer.impl.visibilityManager.isolate(clashArr[0], models[0]);
    viewer.impl.visibilityManager.isolate(clashArr[1], models[1]);
}

function setClashColors(clashArr) {
    models.map( model => {
        viewer.impl.visibilityManager.isolate(-1, model);
        viewer.clearThemingColors(model);
    });

    function colorDBids(ids, model) {
        ids.map(id => {
            viewer.impl.visibilityManager.show(id, model);
            viewer.setThemingColor(id, red, model);
        })
    }
    colorDBids(clashArr[0], models[0]);
    colorDBids(clashArr[1], models[1]);
}

initializeViewer();
