var nameinput;
var windtext;
var editIndex;

var saveWindBtn;
var deleteWindBtn;

var windReadOnlyText;

var windlist;

var errortexts = {
    notnumber: 'is not number',
};
var errorTypes = {
    notnumber: 0,
};

var mapWidth;
var mapHeight;
var startLineSizeInput;

var shareBtn;

var validtext;

function windInit() {
    if (localStorage.getItem(localStorageNames.windlist) == null) {
        saveWind();
    } else {
        loadWind();
    }
    mapWidth = document.getElementById("map-width");
    mapHeight = document.getElementById("map-height");
    startLineSizeInput = document.getElementById("start-line-size");

    loadWindFromURL();
    nameinput = document.getElementById("editor-wind-name");
    windtext = document.getElementById("editor-wind");
    validtext = document.getElementById("wind-valid");
    windtext.addEventListener("input", function () {
        checkErrors();
        updatePreview();
    });

    saveWindBtn = document.getElementById("editor-save");
    deleteWindBtn = document.getElementById("delete-btn");
    shareBtn = document.getElementById("share-btn");

    saveWindBtn.addEventListener("click", editorSaveClick);
    deleteWindBtn.addEventListener("click", deleteClick);
    shareBtn.addEventListener("click", shareBtnClick);

    windReadOnlyText = document.getElementById("wind-readonly-text");

    mapHeight.addEventListener("change", updatePreview);

    document.getElementById("load-wind-save").addEventListener("click", function () {
        console.log(newwind)
        wind[wind.length] = newwind;
        saveWind();
        windChange();
        addWind();
    });

    var editModal = document.getElementById("wind-editor-window");
    editModal.addEventListener("hidden.bs.modal", function () {
        removeEventListener("resize", updatePreview);
    })
}

function checkErrors() {
    var windtmp = splitWind(windtext.value);
    var errors = [];
    var c = 0;
    for (var i = 0; i < windtmp.length; i++) {
        if (isNaN(parseInt(windtmp[i]))) {
            errors[errors.length] = {
                type: errorTypes.notnumber, text: '"' + windtmp[i] +
                    '" ' + errortexts.notnumber, char: c
            }
        }
        c += windtmp[i].length + 1;
    }

    if (errors.length > 0) {
        var notnambercount = 0;
        var numberspaces = 0;
        for (var i = 0; i < errors.length; i++) {
            if (errors[i].type == errorTypes.numberisspace) {
                numberspaces++;
            }
            notnambercount++;
        }
        validtext.innerText =
            `You have ${errors.length} error${(errors.length > 1) ? "s" : ""} in wind.\n`;
        for (var i = 0; i < errors.length; i++) {
            if (errors[i].type == errorTypes.notnumber) {
                validtext.innerText += errors[i].text + "\n";
            }
        }
        validtext.className = "invalid-feedback d-block";
    } else {
        validtext.innerText = "Wind is correct";
        validtext.className = "valid-feedback d-block";
    }
}

function updatePreview() {
    var parsedWind = [];
    var size = Math.round((parseInt(mapHeight.value) - 4) / Math.sin(Math.PI / 4));
    var windtmp = splitWind(windtext.value);

    for (var i = 0; i < size; i++) {
        var parsedValue = parseInt(windtmp[i % windtmp.length]);
        if (!isNaN(parsedValue)) {
            parsedWind.push(parsedValue);
        }
    }

    var editorPreview = document.getElementById("editor-preview");
    editorPreview.innerHTML = "";
    editorPreview.appendChild(getWindSvg(parsedWind, -4, window.innerWidth / 4 - 20, window.innerHeight - 166, 2));
    console.log("bchbhscb")
}

function deleteClick() {
    if (editIndex != -1) {
        wind.splice(windscenario, 1);

        windscenariocontrol.selectedIndex = 0;
        saveWind();
        windChange();
        addWind();
    }
}

function editorSaveClick() {
    var newwind = {};
    var windIndex = editIndex;

    newwind.name = nameinput.value;
    newwind.type = windTypes.userdefined;
    newwind.wind = splitWind(windtext.value);
    for (var i = 0; i < newwind.wind.length; i++) {
        newwind.wind[i] = parseInt(newwind.wind[i])
    }
    newwind.width = formatNumber(parseInt(mapWidth.value), 40);
    newwind.height = formatNumber(parseInt(mapHeight.value), 30);
    newwind.startsize = formatNumber(parseInt(startLineSizeInput.value), 15);
    newwind.stepscount = newwind.wind.length;
    newwind.allowedit = true;
    newwind = formatWind(newwind);
    if (editIndex == -1) {
        wind.splice(wind.length, 0, newwind);
        windscenario = wind.length - 1;
    } else {
        wind[windIndex] = newwind;
        windscenario = windIndex;
    }

    saveWind();
    addWind();
    windscenariocontrol.selectedIndex = windscenario;
    windChange();
}

function formatNumber(num, defaultValue) {
    num = Math.round(num);
    if (isNaN(num)) {
        return defaultValue;
    } else {
        return num;
    }
}

function saveWind() {
    windlist = {};
    windlist.names = [];
    var startI = windPresets.length;
    for (var i = startI; i < wind.length; i++) {
        localStorage.setItem(localStorageNames.wind.toString() + (i - startI).toString(),
            JSON.stringify(wind[i]));
        windlist.names[i - startI] = wind[i].name;
    }

    localStorage.setItem(localStorageNames.windlist, JSON.stringify(windlist));
}

function loadWind() {
    windlist = JSON.parse(localStorage.getItem(localStorageNames.windlist));
    for (var i = 0; i < windPresets.length; i++) {
        wind[i] = windPresets[i];
    }
    var startI = windPresets.length;
    for (var i = 0; i < windlist.names.length; i++) {
        var newwind = JSON.parse(localStorage.getItem(localStorageNames.wind + i.toString()))
        wind[i + startI] = newwind;
        if (newwind.startsize == undefined) {
            newwind.startsize = 15;
        }
    }
}

function formatWind(wind) {
    if (wind.startsize == undefined) {
        wind.startsize = 15;
    }

    return wind;
}

function editorSetReadonlyState(rs) {
    saveWindBtn.disabled = rs;
    deleteWindBtn.disabled = rs;
    windReadOnlyText.hidden = !rs;

    windtext.readOnly = rs;
    nameinput.readOnly = rs;
}

function windEditorStart(iscreate) {
    addEventListener("resize", updatePreview);
    updatePreview();

    shareBtn.hidden = true;
    if (iscreate) {
        editIndex = -1
        editorSetReadonlyState(false);
    } else {
        editIndex = windscenario;
        if (wind[windscenariocontrol.selectedIndex].type == windTypes.userdefined) {
            editorSetReadonlyState(false);
            shareBtn.hidden = false;
        } else {
            editorSetReadonlyState(true);
        }
    }

    if (editIndex == -1) {
        nameinput.value = "User Defined " + (windlist.names.length + 1);
        // TODO: | разпознование количетва User defined чтобы не было 
        // TODO: | * User defined 1
        // TODO: | * Named wind
        // TODO: | * User defined 3

        windtext.value = "0, 0, 0";

    } else {
        mapWidth.value = wind[windscenario].width;
        mapHeight.value = wind[windscenario].height;
        if (wind[windscenario].startsize == undefined) {
            startLineSizeInput.value = 15;
        } else {
            startLineSizeInput.value = wind[windscenario].startsize;
        }

        nameinput.value = wind[windscenario].name;

        windtext.value = "";
        for (var i = 0; i < wind[windscenario].wind.length; i++) {
            windtext.value += wind[windscenario].wind[i].toString();
            if (i != wind[windscenario].wind.length - 1) {
                windtext.value += ", ";
            }
        }
    }
}
var newwind;
function loadWindFromURL() {
    var hash = location.hash;
    hash = hash.replace("#", "");
    if (hash[0] == "w") {
        hash = hash.replace("w", "");
        hash = decodeURI(hash);
        console.log(hash);
        try {
            newwind = JSON.parse(hash);
            var addWindModal = new bootstrap.Modal("#add-wind-url-window");
            var text = "";
            for (var i = 0; i < newwind.wind.length; i++) {
                text += newwind.wind[i];
                if (i != newwind.wind.length - 1) {
                    text += ", ";
                }
            }
            document.getElementById("add-wind-text").value = text;
            document.getElementById("add-wind-name").value = newwind.name;
            addWindModal.show();
        } catch (err) {
            console.log(err);
        }
    }

    location.hash = "";
    history.pushState("", document.title, window.location.pathname + window.location.search);
}
function shareBtnClick() {
    var text = "https://tss.boats/#w" + JSON.stringify(wind[windscenariocontrol.selectedIndex]);
    text = encodeURI(text);
    navigator.clipboard.writeText(text);
    var tooltip = new bootstrap.Tooltip("shar-btn");
    tooltip.show();
    saveWind();
}

function getTypeIndex(type) {
    for (var i = 0; i < wind.length; i++) {
        if (wind[i].type == type) {
            return i;
        }
    }
}

function splitWind(text) {
    return text.split(/(?:,| |\n)+/);
}
