/*
 * credits
 * maplibre: "https://github.com/maplibre/maplibre-gl-js"    // for map and marker control
 * geoapify: "https://apidocs.geoapify.com/playground/icon"  // for marker icon
 */

var window_exit = true;
var location_info = new Array(10); // creating a static list with 10 entities, because that's what's in the DB
var map = null; // creates the map obj
var current_dog_color = "";
var old_marker_thread = 0;

// to delay execution of different functions, namely the marker animation
const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

// send a post request in order to recieve information from the server
const http_post = (URL, DATA) => {
  return axios({
    method: "post",
    url: URL,
    data: DATA,
  }).then((response) => {
    return response.data;
  });
};

// example web object for fast updating
const web_obj = {
  icon_color: "red",
  location: [
    { longitude: 37.12345, latitude: -85.123416 },
    { longitude: 37.12356, latitude: -85.123426 },
    { longitude: 37.12367, latitude: -85.123436 },
    { longitude: 37.12378, latitude: -85.123446 },
    { longitude: 37.12387, latitude: -85.123456 },
    { longitude: 37.12396, latitude: -85.123466 },
    { longitude: 37.12385, latitude: -85.123476 },
    { longitude: 37.12376, latitude: -85.123486 },
    { longitude: 37.12367, latitude: -85.123496 },
    { longitude: 37.12355, latitude: -85.123486 },
  ],
};

// all dogs:
// skye
// griffin
// scooby

// quick update function for testing new data, can encrypt and decrypt based on key from server, but the data isnt sensitive
const set_new_info = async () => {
  await http_post(
    "https://calvinllc.net/tracker.php",
    JSON.stringify({
      type: "send",
      dog: "scooby",
      post: JSON.stringify(web_obj),
    })
  );
  console.log("updated!");
};
//set_new_info();

// sends a post request to server to recieve the location data of each dog
const get_location_info = async (name) => {
  const data = await http_post(
    "https://calvinllc.net/tracker.php",
    JSON.stringify({ type: "recieve", dog: name, post: "" })
  ); // have to stringify cuz old php version can't tranform json to a string

  if (!data) return "error getting data from the server"; // if nothing is in data, return error message

  location_info = data.location; // save our location info to the array we created earlier
  current_dog_color = data.icon_color;
};

// (re-)creates map in order to display the marker on it. It also sets the camera position to the first point of the animal
const init = async (name) => {
  // get the location information from the server
  await get_location_info(name);

  // error handling in case of server failure, can be replaced with try and catch but eh
  if (!location_info[0]) {
    console.log("error reading new information from server");
    return;
  }

  // error handling while selecting a new dog to track
  if (map != null) {
    // show the loading circle
    toggle_loading(true);

    // delete previous map
    document.getElementById("map").remove;

    // we want to destroy previous thread, shows a loading screen
    var old_thread_num = old_marker_thread;
    window_exit = false;

    // sleep until old thread is destroyed (fairly close, sleeping to save CPU)
    while (old_thread_num == old_marker_thread) {
      await sleep(100);
    }

    // let next thread run, stop displaying loading
    window_exit = true;
    toggle_loading(false);
  }

  // create the map itself, credit: maplibre, line 3
  map = new maplibregl.Map({
    container: "map",
    style:
      "https://api.maptiler.com/maps/streets/style.json?key=get_your_own_OpIi9ZULNHzrESv6T2vL",
    center: [location_info[0].latitude, location_info[0].longitude],
    zoom: 15,
  });
};

// animates the marker
const animate_marker = async (name) => {
  // make first letter uppercase
  var capitol_name = name[0].toUpperCase() + name.substring(1);

  // set html text to say that it's tracking the proper dog
  document.getElementById("current_dog").innerHTML =
    "Current Dog: " + capitol_name;

  // wait for init to finish (gets new location data, deletes map, creates new map with new info)
  await init(name);

  // update html with color of dog, is grabbed from server, so it gets updated here
  document.getElementById("current_dog_color").innerHTML =
    capitol_name + "'s Color: " + current_dog_color;

  // creating an element for the icon of the dog
  var dog_icon = document.createElement("div");

  // sizing
  dog_icon.style.width = "34px";
  dog_icon.style.height = "34px";
  dog_icon.style.backgroundSize = "contain";

  // image itself, grabbed from geoapify's nice marker creator, credit on line 4
  dog_icon.style.backgroundImage =
    "url(https://api.geoapify.com/v1/icon/?type=circle&color=" +
    current_dog_color +
    "&icon=dog&iconType=awesome&scaleFactor=2&apiKey=a8fa1cb553a34a598de6f07b3a8dfbb1)";

  // add the initial marker to the map
  var marker = new maplibregl.Marker(dog_icon, {
    anchor: "bottom",
    offset: [0, 5],
  })
    .setLngLat([location_info[0].latitude, location_info[0].longitude])
    .addTo(map);

  // some vars we need to do the animation
  var i = 0;
  var toggle = false;
  var increment = 1;

  // make sure the browser is in focus / if the thread hasn't been ended
  // window_exit only turns false if the window is no longer in focus, OR if thread needs to end
  while (document.hasFocus() && window_exit) {
    // set the new position of the marker
    marker.setLngLat([location_info[i].latitude, location_info[i].longitude]);

    // delay a little bit before each animation to have an actual animation (kinda scuff, ik we can do with css)
    await sleep(1000);

    // make the index go up, then down, then back up again, based on the length of the list
    if (i == location_info.length - 1 || i == 0) toggle = !toggle;
    if (toggle) increment = 1;
    else increment = -1;
    i += increment;

    // update the text on the sidebar with current position
    document.getElementById("current_frame").innerHTML =
      "Current Frame: " + (i + 1);
  }
  ++old_marker_thread;
};

// toggle hiding and showing the dropdown content
const drop_down = () => {
  document.getElementById("dog_dropdown").classList.toggle("show");
};

// change whether the loading animation is shown
const toggle_loading = (toggle_load_overlay) => {
  document.getElementById("overlay").style.display = toggle_load_overlay
    ? "block"
    : "none";
};

// run animate_marker to properly animate the marker, runs it with skye at the start cuz he best dog
window.onload = () => {
  animate_marker("skye");
};

// make sure we clean up, only does anything if the browser is archaic
window.onabort = () => {
  window_exit = false; // animation thread only runs if this is true
};

// Close the dropdown menu if the user clicks outside of it
window.onclick = function (event) {
  // makes sure it has the dropbutton class
  if (!event.target.matches(".dropbtn")) {
    // saves for l8r
    var dropdowns = document.getElementsByClassName("dropdown-content");
    for (var i = 0; i < dropdowns.length; ++i) {
      // if it's open, close it :)
      if (dropdowns[i].classList.contains("show"))
        dropdowns[i].classList.remove("show");
    }
  }
};