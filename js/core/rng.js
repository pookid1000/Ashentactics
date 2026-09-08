// Shared randomness helpers.

window.DS = window.DS || {};

(function () {
  let uidCounter = 0;

  DS.RNG = {
    roll() { return Math.random(); },
    chance(p) { return Math.random() < p; },
    int(min, max) { return min + Math.floor(Math.random() * (max - min + 1)); },
    pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
    shuffle(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
    // items: array of objects; wKey: property holding the weight (default 'weight')
    weighted(items, wKey) {
      wKey = wKey || 'weight';
      const total = items.reduce((s, it) => s + (it[wKey] || 1), 0);
      let r = Math.random() * total;
      for (const it of items) {
        r -= (it[wKey] || 1);
        if (r <= 0) return it;
      }
      return items[items.length - 1];
    },
    uuid() { return 'u' + Date.now().toString(36) + '_' + (uidCounter++).toString(36) + '_' + Math.floor(Math.random() * 1e6).toString(36); },
  };
})();
