// ASHEN TACTICS — quests, events, mail screens (CONTRACT.md §6.4).

window.DS = window.DS || {};

(function () {
  const el = (...a) => DS.C.el(...a);

  // ─────────────── dialogue player ───────────────

  function playDialogue(quest, step, onFinish) {
    let idx = 0;
    const body = el('div', 'dialogue-box');
    const speaker = el('div', 'dlg-speaker display');
    const text = el('div', 'dlg-text');
    body.appendChild(speaker);
    body.appendChild(text);
    const hint = el('div', 'small text-faint italic', 'Click "Next" to continue.');
    body.appendChild(hint);

    let modal;
    let typing = null;

    function showLine() {
      const line = step.lines[idx];
      if (!line) { modal.close(); onFinish(); return; }
      speaker.textContent = line.speaker;
      text.textContent = '';
      if (typing) clearInterval(typing);
      if (DS.State.settings.reduceMotion) { text.textContent = line.text; return; }
      let i = 0;
      typing = setInterval(() => {
        i += 2;
        text.textContent = line.text.slice(0, i);
        if (i >= line.text.length) clearInterval(typing);
      }, 16);
    }

    modal = DS.C.modal({
      title: quest.icon + ' ' + quest.npc,
      body, blocking: true,
      actions: [{
        label: 'Next ▸', cls: 'primary',
        onClick: () => {
          const line = step.lines[idx];
          if (typing && text.textContent.length < (line ? line.text.length : 0)) {
            clearInterval(typing);
            text.textContent = line.text;
            return true; // keep modal open
          }
          idx += 1;
          if (idx >= step.lines.length) { onFinish(); return; }
          showLine();
          return true;
        },
      }],
    });
    showLine();
  }

  // ─────────────── quests ───────────────

  function stepLabel(step) {
    switch (step.type) {
      case 'dialogue': return '💬 Speak';
      case 'battle': return '⚔ Battle';
      case 'collect': {
        const d = DS.C.findItem(step.itemId);
        return '📦 Bring ' + (d ? d.name : step.itemId) + ' ×' + (step.count || 1);
      }
      case 'clearStage': return '🗺 Clear a stage';
      default: return step.type;
    }
  }

  DS.UI.registerScreen('quests', {
    render() {
      const wrap = el('div', 'screen');
      wrap.appendChild(el('div', 'screen-header', [el('h2', null, 'Fellow Travelers'), el('div', 'hint', 'Their roads cross yours')]));

      // Daily tasks.
      const dailies = DS.QuestLog.dailyTasks();
      const dBox = el('div', 'detail-panel');
      dBox.appendChild(el('div', 'section-title', 'Daily Tending'));
      dailies.forEach((d) => {
        dBox.appendChild(el('div', 'row spread stat-row', [
          el('span', null, (d.done ? '✅ ' : d.icon + ' ') + d.name + ' — ' + d.desc),
          el('span', 'small text-dim', d.done ? 'Done' : [DS.C.currencyIcon('humanity'), ' ' + d.rewards.humanity]),
        ]));
      });
      wrap.appendChild(dBox);

      (DS.QUESTS || []).forEach((q) => {
        const st = DS.QuestLog.questState(q.id);
        const box = el('div', 'quest-card panel-ornate' + (st.claimed ? ' locked' : ''));
        box.appendChild(el('div', 'row spread', [
          el('h3', null, q.icon + ' ' + q.name),
          el('span', 'badge', st.claimed ? 'Complete' : st.done ? 'Reward waiting' : 'Step ' + (st.step + 1) + ' / ' + st.totalSteps),
        ]));
        box.appendChild(el('div', 'small text-dim italic', q.npc + ' — ' + q.summary));

        // Step tracker.
        const track = el('div', 'quest-track');
        q.steps.forEach((sp, i) => {
          const cls = i < st.step ? 'done' : i === st.step && !st.done ? 'current' : 'todo';
          track.appendChild(el('span', 'quest-step ' + cls, stepLabel(sp)));
        });
        box.appendChild(track);

        if (st.claimed) {
          box.appendChild(el('div', 'small text-gold', '✦ Their tale is told.'));
        } else if (st.claimable) {
          const claim = el('button', 'primary', 'Claim Reward');
          claim.onclick = () => {
            const summary = DS.QuestLog.claimRewards(q.id);
            if (summary) { DS.C.rewardsPopup(summary, { title: q.name }); DS.UI.refreshTopBar(); setTimeout(() => DS.UI.rerender(), 80); }
          };
          box.appendChild(claim);
        } else if (st.currentStep) {
          const step = st.currentStep;
          if (step.type === 'dialogue') {
            const btn = el('button', 'primary', '💬 Speak with ' + q.npc.split(' ')[0]);
            btn.onclick = () => playDialogue(q, step, () => {
              DS.QuestLog.advance(q.id);
              DS.UI.rerender();
            });
            box.appendChild(btn);
          } else if (step.type === 'battle') {
            const btn = el('button', 'primary', '⚔ ' + (step.intro || 'Fight'));
            btn.onclick = () => {
              DS.UI.navigate('battle', {
                spawns: step.encounter.spawns,
                background: step.encounter.background || 'burg',
                source: { kind: 'quest', questId: q.id, spawns: step.encounter.spawns },
              });
            };
            box.appendChild(btn);
          } else if (step.type === 'collect') {
            const have = DS.State.inventory.items[step.itemId] || 0;
            const d = DS.C.findItem(step.itemId);
            box.appendChild(el('div', 'small', 'Carrying: ' + have + ' / ' + (step.count || 1) + (step.hint ? ' — ' + step.hint : '')));
            const btn = el('button', st.canAdvance ? 'primary' : '', 'Hand over ' + (d ? d.name : step.itemId));
            btn.disabled = !st.canAdvance;
            btn.onclick = () => {
              const res = DS.QuestLog.advance(q.id);
              if (res.ok) { DS.SFX.play('chime'); DS.UI.rerender(); }
              else DS.C.toast('Not enough yet.', { icon: '📦', img: DS.Assets && DS.Assets.item(step.itemId) });
            };
            box.appendChild(btn);
          } else if (step.type === 'clearStage') {
            box.appendChild(el('div', 'small', step.hint || ('Clear stage ' + step.stageId + '.')));
            const btn = el('button', st.canAdvance ? 'primary' : '', st.canAdvance ? 'Report back' : 'Not yet cleared');
            btn.disabled = !st.canAdvance;
            btn.onclick = () => { DS.QuestLog.advance(q.id); DS.UI.rerender(); };
            box.appendChild(btn);
          }
        }
        wrap.appendChild(box);
      });
      return wrap;
    },
  });

  // ─────────────── events ───────────────

  DS.UI.registerScreen('events', {
    render() {
      const outer = el('div', 'screen events-screen');
      outer.appendChild(DS.C.screenBgImage(DS.Assets.background('events')));
      const wrap = el('div', 'screen-inner');
      wrap.appendChild(el('div', 'screen-header', [el('h2', null, 'Tidings'), el('div', 'hint', 'The world stirs')]));
      (DS.EVENTS || []).forEach((ev) => {
        const prog = DS.Meta.eventProgress(ev.id);
        const box = el('div', 'event-card panel-ornate');
        box.style.setProperty('--ev1', ev.palette[0]);
        box.style.setProperty('--ev2', ev.palette[1]);
        box.appendChild(el('div', 'row spread', [
          el('h3', null, ev.icon + ' ' + ev.name),
          prog.claimable ? el('span', 'notif-dot ev-dot', String(prog.claimable)) : null,
        ]));
        box.appendChild(el('div', 'small italic text-dim', ev.tagline));
        box.appendChild(el('p', 'small', ev.desc));
        if (prog.progress !== null && prog.progress !== undefined && ev.kind !== 'boost') {
          box.appendChild(el('div', 'small text-gold', 'Progress: ' + prog.progress));
        }
        const tierList = el('div', 'col');
        prog.tiers.forEach((t) => {
          const row = el('div', 'row spread stat-row' + (t.claimed ? ' locked' : ''));
          row.appendChild(el('span', 'small', (t.claimed ? '✅ ' : t.reached ? '🔶 ' : '⬜ ') + t.tier.desc));
          const rw = t.tier.rewards || {};
          const parts = [];
          if (rw.humanity) { parts.push(DS.C.currencyIcon('humanity')); parts.push(' ' + rw.humanity + '  '); }
          if (rw.signs) { parts.push(DS.C.currencyIcon('signs')); parts.push(' ' + rw.signs + '  '); }
          if (rw.souls) { parts.push(DS.C.currencyIcon('souls')); parts.push(' ' + rw.souls + '  '); }
          row.appendChild(el('span', 'small text-dim', parts));
          if (t.reached && !t.claimed) {
            const btn = el('button', 'small primary', 'Claim');
            btn.onclick = () => {
              const summary = DS.Meta.claimEventTier(ev.id, t.idx);
              if (summary) { DS.C.rewardsPopup(summary, { title: ev.name }); DS.UI.refreshTopBar(); setTimeout(() => DS.UI.rerender(), 80); }
            };
            row.appendChild(btn);
          }
          tierList.appendChild(row);
        });
        box.appendChild(tierList);
        wrap.appendChild(box);
      });
      outer.appendChild(wrap);
      return outer;
    },
  });

  // ─────────────── mail ───────────────

  DS.UI.registerScreen('mail', {
    render() {
      const outer = el('div', 'screen mail-screen');
      outer.appendChild(DS.C.screenBgImage(DS.Assets.background('mail')));
      const wrap = el('div', 'screen-inner');
      const claimAll = el('button', 'small', 'Claim All');
      claimAll.onclick = () => {
        let all = [];
        DS.Meta.mailList().forEach((m) => {
          const summary = DS.Meta.claimMail(m.id);
          if (summary && summary.length) all = all.concat(summary);
        });
        if (all.length) { DS.C.rewardsPopup(all, { title: 'The crow delivers' }); DS.UI.refreshTopBar(); setTimeout(() => DS.UI.rerender(), 80); }
        else DS.C.toast('Nothing left to claim.', { icon: '🐦‍⬛', img: DS.Assets && DS.Assets.hub('deliveries') });
      };
      wrap.appendChild(el('div', 'screen-header', [el('h2', null, 'Crow\'s Deliveries'), claimAll]));

      DS.Meta.mailList().forEach((m) => {
        const box = el('div', 'mail-card panel' + (m.status === 'claimed' ? ' locked' : ''));
        box.appendChild(el('div', 'row spread', [
          el('div', null, [
            el('div', 'display mail-subject', m.icon + ' ' + m.subject),
            el('div', 'small text-dim', 'From: ' + m.from),
          ]),
          el('span', 'badge', m.status === 'claimed' ? 'Claimed' : m.status === 'read' ? 'Read' : 'New'),
        ]));
        box.onclick = () => {
          DS.Meta.readMail(m.id);
          const body = el('div');
          body.appendChild(el('p', null, m.body));
          const actions = [{ label: 'Close', cls: 'ghost' }];
          if (m.rewards && m.status !== 'claimed') {
            actions.unshift({
              label: 'Claim Attachment', cls: 'primary',
              onClick: () => {
                const summary = DS.Meta.claimMail(m.id);
                if (summary) { DS.C.rewardsPopup(summary, { title: m.subject }); DS.UI.refreshTopBar(); setTimeout(() => DS.UI.rerender(), 80); }
              },
            });
          }
          DS.C.modal({ title: m.icon + ' ' + m.subject, body, actions });
          setTimeout(() => DS.UI.rerender(), 60);
        };
        wrap.appendChild(box);
      });
      outer.appendChild(wrap);
      return outer;
    },
  });
})();
