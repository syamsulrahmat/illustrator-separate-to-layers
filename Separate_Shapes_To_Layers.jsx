/**
 * Adobe Illustrator ExtendScript: Separate Shapes to Layers
 * -----------------------------------------------------------------------------
 * Distributes selected shapes and objects onto their own individual layers while
 * strictly preserving nested groups (groups inside groups) as intact units.
 *
 * Rules & Behavior:
 * 1. Loose selected shapes/objects (PathItem, CompoundPathItem, TextFrame, etc.)
 *    are moved each to its own newly created layer.
 * 2. Top-level selected groups are unpacked by one level:
 *    - All non-group children (individual shapes/paths/text) are separated into
 *      individual layers.
 *    - Any child that is a GroupItem ("group inside a group") remains INTACT
 *      as a group and is moved to its own layer as a single grouped unit.
 * 3. Clip Groups (masked groups) are preserved intact to prevent breaking masks.
 * 4. Stacking Order (z-order) is strictly preserved from bottom to top.
 * 5. New layers are created right above the original source layer in the Layers panel.
 * 6. Emptied parent groups are safely cleaned up.
 *
 * Compatibility: Adobe Illustrator CS6 through CC 2026+ (macOS & Windows)
 */

#target illustrator

(function () {
    "use strict";

    // -------------------------------------------------------------------------
    // Pre-flight Validation
    // -------------------------------------------------------------------------
    if (app.documents.length === 0) {
        alert("Separate Shapes to Layers\n\nPlease open an Illustrator document before running this script.");
        return;
    }

    var doc = app.activeDocument;
    var selection = doc.selection;

    if (!selection || selection.length === 0) {
        alert("Separate Shapes to Layers\n\nNo objects selected!\nPlease select one or more shapes or groups to separate into layers.");
        return;
    }

    // -------------------------------------------------------------------------
    // Helper Functions
    // -------------------------------------------------------------------------

    /**
     * Determines whether an item is a descendant of any item in the given list.
     * Prevents processing child items twice if both parent and child were in selection.
     */
    function isDescendantOfAny(item, list) {
        var p = item.parent;
        while (p && p.typename !== "Document" && p.typename !== "Layer") {
            for (var i = 0; i < list.length; i++) {
                if (p === list[i]) {
                    return true;
                }
            }
            p = p.parent;
        }
        return false;
    }

    /**
     * Finds the owning top-level or parent Layer for an item.
     */
    function getOwningLayer(item) {
        var curr = item;
        while (curr && curr.typename !== "Layer") {
            curr = curr.parent;
        }
        return curr || doc.activeLayer;
    }

    /**
     * Generates a descriptive, clean name for the newly created layer,
     * prefixing the source layer name (e.g., "SourceLayer - Path 1").
     */
    function generateLayerName(item, isNestedGroup, counter, srcLayerName) {
        var baseName = "";

        if (item.name && item.name.length > 0) {
            baseName = item.name;
        } else {
            var type = item.typename;

            if (type === "GroupItem") {
                if (item.clipped) {
                    baseName = "Clip Group " + counter;
                } else {
                    baseName = isNestedGroup ? ("Group " + counter) : ("Group " + counter);
                }
            } else if (type === "PathItem") {
                baseName = "Path " + counter;
            } else if (type === "CompoundPathItem") {
                baseName = "Compound Path " + counter;
            } else if (type === "TextFrame") {
                try {
                    var preview = item.contents.replace(/[\r\n\t]+/g, " ");
                    if (preview.length > 20) {
                        preview = preview.substring(0, 20) + "...";
                    }
                    if (preview.length > 0) {
                        baseName = "Text (" + preview + ")";
                    }
                } catch (e) {}
                if (!baseName) baseName = "Text " + counter;
            } else if (type === "RasterItem") {
                baseName = "Image " + counter;
            } else if (type === "PlacedItem") {
                baseName = "Placed Item " + counter;
            } else if (type === "MeshItem") {
                baseName = "Mesh " + counter;
            } else if (type === "PluginItem") {
                baseName = "Plugin Object " + counter;
            } else {
                baseName = "Object " + counter;
            }
        }

        if (srcLayerName && srcLayerName.length > 0) {
            // Avoid duplicating prefix if baseName already starts with source layer name
            if (baseName.indexOf(srcLayerName) === 0) {
                return baseName;
            }
            return srcLayerName + " - " + baseName;
        }

        return baseName;
    }

    // -------------------------------------------------------------------------
    // Step 1: Filter Top-Level Selected Objects
    // -------------------------------------------------------------------------
    var topSelected = [];
    for (var i = 0; i < selection.length; i++) {
        if (!isDescendantOfAny(selection[i], selection)) {
            topSelected.push(selection[i]);
        }
    }

    if (topSelected.length === 0) {
        alert("Separate Shapes to Layers\n\nNo valid root objects found in selection.");
        return;
    }

    // -------------------------------------------------------------------------
    // Step 2: Build Ordered Work Units (Bottom to Top)
    // -------------------------------------------------------------------------
    // Illustrator's selection array is ordered Top-to-Bottom in z-order.
    // To preserve visual hierarchy when creating layers, we collect items
    // from Bottom to Top (reversing the top-level selection).

    var workUnits = [];
    var parentGroupsToClean = [];

    var shapesCount = 0;
    var nestedGroupsCount = 0;
    var topGroupsUnpacked = 0;

    for (var j = topSelected.length - 1; j >= 0; j--) {
        var topItem = topSelected[j];

        // Check if item is a group that should be unpacked
        // Note: Clip groups (clipped == true) are preserved intact as groups
        if (topItem.typename === "GroupItem" && !topItem.clipped) {
            topGroupsUnpacked++;
            parentGroupsToClean.push(topItem);

            // group.pageItems[0] is top-most inside the group.
            // group.pageItems[length - 1] is bottom-most.
            // Loop from bottom to top to preserve inner z-order.
            var children = [];
            for (var c = topItem.pageItems.length - 1; c >= 0; c--) {
                children.push(topItem.pageItems[c]);
            }

            for (var k = 0; k < children.length; k++) {
                var child = children[k];
                var isGroup = (child.typename === "GroupItem");

                if (isGroup) {
                    nestedGroupsCount++;
                    workUnits.push({
                        item: child,
                        isNestedGroup: true,
                        sourceLayer: getOwningLayer(child)
                    });
                } else {
                    shapesCount++;
                    workUnits.push({
                        item: child,
                        isNestedGroup: false,
                        sourceLayer: getOwningLayer(child)
                    });
                }
            }
        } else {
            // Loose shape or top-level clip group
            if (topItem.typename === "GroupItem" && topItem.clipped) {
                nestedGroupsCount++;
            } else {
                shapesCount++;
            }

            workUnits.push({
                item: topItem,
                isNestedGroup: (topItem.typename === "GroupItem"),
                sourceLayer: getOwningLayer(topItem)
            });
        }
    }

    if (workUnits.length === 0) {
        alert("Separate Shapes to Layers\n\nNo eligible items to separate.");
        return;
    }

    // -------------------------------------------------------------------------
    // Step 3: Create Layers & Move Items
    // -------------------------------------------------------------------------
    // We maintain a reference point per source layer so that new layers are
    // placed sequentially directly above their original layer.

    var lastLayerBySource = {};
    var sourceLayerCounters = {};
    var createdLayers = [];
    var movedItems = [];

    for (var u = 0; u < workUnits.length; u++) {
        var unit = workUnits[u];
        var item = unit.item;
        var srcLayer = unit.sourceLayer;
        var srcLayerId = srcLayer.name;

        // Determine reference layer for placement
        var refLayer = lastLayerBySource[srcLayerId] || srcLayer;

        // Create new layer
        var newLayer = doc.layers.add();

        // Position the new layer directly above the reference layer
        newLayer.move(refLayer, ElementPlacement.PLACEBEFORE);
        lastLayerBySource[srcLayerId] = newLayer;

        // Increment per-source-layer counter
        sourceLayerCounters[srcLayerId] = (sourceLayerCounters[srcLayerId] || 0) + 1;
        var layerIndex = sourceLayerCounters[srcLayerId];

        // Assign descriptive name with source layer prefix
        var layerName = generateLayerName(item, unit.isNestedGroup, layerIndex, srcLayerId);
        try {
            newLayer.name = layerName;
        } catch (e) {
            // In case of any name conflict
            newLayer.name = layerName + " (" + (u + 1) + ")";
        }

        // Safely move item to new layer (handling locked/hidden state)
        var wasLocked = false;
        var wasHidden = false;
        var srcLayerWasLocked = false;

        try {
            srcLayerWasLocked = srcLayer.locked;
            if (srcLayerWasLocked) srcLayer.locked = false;
        } catch (e) {}

        try {
            wasLocked = item.locked;
            if (wasLocked) item.locked = false;
        } catch (e) {}

        try {
            wasHidden = item.hidden;
        } catch (e) {}

        try {
            item.move(newLayer, ElementPlacement.PLACEATBEGINNING);
            movedItems.push(item);
        } catch (moveErr) {
            // Log or continue if single item fails
        }

        if (wasLocked) {
            try { item.locked = true; } catch (e) {}
        }
        if (wasHidden) {
            try { item.hidden = true; } catch (e) {}
        }
        if (srcLayerWasLocked) {
            try { srcLayer.locked = true; } catch (e) {}
        }

        createdLayers.push(newLayer);
    }

    // -------------------------------------------------------------------------
    // Step 4: Clean Up Emptied Parent Groups
    // -------------------------------------------------------------------------
    for (var g = 0; g < parentGroupsToClean.length; g++) {
        var grp = parentGroupsToClean[g];
        try {
            if (grp.pageItems.length === 0) {
                grp.remove();
            }
        } catch (cleanErr) {
            // Ignore if already deleted
        }
    }

    // -------------------------------------------------------------------------
    // Step 5: Update Active Selection & Completion Notice
    // -------------------------------------------------------------------------
    try {
        doc.selection = null;
        for (var s = 0; s < movedItems.length; s++) {
            try {
                movedItems[s].selected = true;
            } catch (e) {}
        }
    } catch (e) {}

    // Brief confirmation dialog
    var msg = "Separation Complete!\n\n" +
              "• New Layers Created: " + createdLayers.length + "\n" +
              "• Shapes Separated: " + shapesCount + "\n" +
              "• Nested Groups Maintained: " + nestedGroupsCount;

    if (topGroupsUnpacked > 0) {
        msg += "\n• Top Groups Unpacked: " + topGroupsUnpacked;
    }

    alert(msg);

})();
