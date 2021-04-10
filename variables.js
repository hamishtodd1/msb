const TAU = Math.PI * 2;
const zAxis = new THREE.Vector3(0,0,1); //also used as a placeholder normal
const yAxis = new THREE.Vector3(0,1,0);
const xAxis = new THREE.Vector3(1,0,0);
const zeroVector = new THREE.Vector3();

var ourClock = new THREE.Clock( true ); //.getElapsedTime ()
var frameDelta = 0;
var frameCount = 0;
var logged = 0;
const debugging = 0;

const log = console.log

const updateFunctions = []

const clock = new THREE.Clock()

const scene = new THREE.Scene()

const clickableRectangles = []

const v0 = new THREE.Vector3()
const v1 = new THREE.Vector3()
const v2 = new THREE.Vector3()
const v3 = new THREE.Vector3()
const v4 = new THREE.Vector3()
const v5 = new THREE.Vector3()

let unitSquareGeo = new THREE.PlaneBufferGeometry()
const rectangles = []

const suspects = []

const bgColor = 0x777777

const socket = io();

const OVERLAY_Z = 7.

let showingScoresMode = false

const dashboard = []

const VISIBLE_AREA_HEIGHT = 20.
const dashboardGap = 1.5
const suspectPositionY = VISIBLE_AREA_HEIGHT/2. - (VISIBLE_AREA_HEIGHT - dashboardGap) / 2.

const sounds = {};