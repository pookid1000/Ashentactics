// ASHEN TACTICS — Expedition map node-graph layout (visual-only data, feeds
// js/ui/hub-ui.js's map screen renderer). Keyed by world id from DS.WORLDS.
// nodes: stageId -> {x, y} in a 0-100-wide SVG viewBox (y grows downward);
//        `height` is that viewBox's height, chosen per world to land the whole
//        graph at a reasonable landscape-ish aspect ratio (the renderer sets
//        the <svg>'s CSS aspect-ratio directly from width:height, so there's no
//        pixel-guessing involved — it always scales cleanly to its container).
//        Every y already includes an 8-unit top pad and 12-unit bottom pad so
//        node rings/fog and the label text under the last node never clip
//        against the viewBox edge.
// edges: [fromStageId, toStageId] pairs. A node is reachable once ANY edge feeding
//        into it comes from a cleared node (see mapNodeState() in hub-ui.js); a
//        node with no incoming edge is the world's own entry point, unlocked as
//        soon as the world itself is (see DS.WORLDS[].unlockPlayerLevel).
// Side-branch stages (side: true in encounters.js) always branch off one main-path
// node and rejoin the very next one, so skipping them never blocks progress — they
// just read as a detour on the map rather than a wall.

window.DS = window.DS || {};

(function () {
  DS.WORLD_MAP_LAYOUT = {
    w1: {
      height: 59,
      nodes: {
        w1s1: { x: 50, y: 8 },
        w1s_side1: { x: 18, y: 14.5 },
        w1s2: { x: 50, y: 21 },
        w1s3: { x: 78, y: 34 },
        w1s4: { x: 50, y: 47 },
      },
      edges: [
        ['w1s1', 'w1s2'], ['w1s1', 'w1s_side1'], ['w1s_side1', 'w1s2'],
        ['w1s2', 'w1s3'], ['w1s3', 'w1s4'],
      ],
    },
    w2: {
      height: 72,
      nodes: {
        w2s1: { x: 50, y: 8 },
        w2s2: { x: 24, y: 21 },
        w2s_side1: { x: 80, y: 27.5 },
        w2s3: { x: 50, y: 34 },
        w2s4: { x: 76, y: 47 },
        w2s5: { x: 50, y: 60 },
      },
      edges: [
        ['w2s1', 'w2s2'], ['w2s2', 'w2s3'], ['w2s2', 'w2s_side1'], ['w2s_side1', 'w2s3'],
        ['w2s3', 'w2s4'], ['w2s4', 'w2s5'],
      ],
    },
    w3: {
      height: 85,
      nodes: {
        w3s1: { x: 50, y: 8 },
        w3s2: { x: 22, y: 21 },
        w3s3: { x: 50, y: 34 },
        w3s_side1: { x: 84, y: 40.5 },
        w3s4: { x: 26, y: 47 },
        w3s5: { x: 55, y: 60 },
        w3s6: { x: 50, y: 73 },
      },
      edges: [
        ['w3s1', 'w3s2'], ['w3s2', 'w3s3'], ['w3s3', 'w3s4'], ['w3s3', 'w3s_side1'], ['w3s_side1', 'w3s4'],
        ['w3s4', 'w3s5'], ['w3s5', 'w3s6'],
      ],
    },
    w4: {
      height: 72,
      nodes: {
        w4s1: { x: 50, y: 8 },
        w4s2: { x: 76, y: 21 },
        w4s_side1: { x: 20, y: 27.5 },
        w4s3: { x: 50, y: 34 },
        w4s4: { x: 24, y: 47 },
        w4s5: { x: 50, y: 60 },
      },
      edges: [
        ['w4s1', 'w4s2'], ['w4s2', 'w4s3'], ['w4s2', 'w4s_side1'], ['w4s_side1', 'w4s3'],
        ['w4s3', 'w4s4'], ['w4s4', 'w4s5'],
      ],
    },
    w5: {
      height: 85,
      nodes: {
        w5s1: { x: 50, y: 8 },
        w5s_side1: { x: 82, y: 14.5 },
        w5s2: { x: 50, y: 21 },
        w5s3: { x: 22, y: 34 },
        w5s4: { x: 48, y: 47 },
        w5s5: { x: 74, y: 60 },
        w5s6: { x: 50, y: 73 },
      },
      edges: [
        ['w5s1', 'w5s2'], ['w5s1', 'w5s_side1'], ['w5s_side1', 'w5s2'],
        ['w5s2', 'w5s3'], ['w5s3', 'w5s4'], ['w5s4', 'w5s5'], ['w5s5', 'w5s6'],
      ],
    },
    oolacile: {
      height: 85,
      nodes: {
        oolacile_s1:    { x: 50, y: 8 },
        oolacile_s2:    { x: 24, y: 21 },
        oolacile_side1: { x: 80, y: 27.5 },
        oolacile_s3:    { x: 50, y: 34 },
        oolacile_s4:    { x: 76, y: 47 },
        oolacile_s5:    { x: 24, y: 60 },
        oolacile_s6:    { x: 50, y: 73 },
      },
      edges: [
        ['oolacile_s1', 'oolacile_s2'],
        ['oolacile_s2', 'oolacile_side1'], ['oolacile_side1', 'oolacile_s3'], ['oolacile_s2', 'oolacile_s3'],
        ['oolacile_s3', 'oolacile_s4'],
        ['oolacile_s4', 'oolacile_s5'],
        ['oolacile_s5', 'oolacile_s6'],
      ],
    },
  };
})();
