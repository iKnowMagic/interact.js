import { EventPhase } from '@interactjs/core/InteractEvent';
import modifiers from '@interactjs/modifiers/base';
import * as utils from '@interactjs/utils';
import raf from '@interactjs/utils/raf';
EventPhase.Resume = 'resume';
EventPhase.InertiaStart = 'inertiastart';
function install(scope) {
    const { interactions, defaults, } = scope;
    interactions.signals.on('new', ({ interaction }) => {
        interaction.inertia = {
            active: false,
            smoothEnd: false,
            allowResume: false,
            startEvent: null,
            upCoords: {},
            xe: 0,
            ye: 0,
            sx: 0,
            sy: 0,
            t0: 0,
            vx0: 0,
            vys: 0,
            duration: 0,
            lambda_v0: 0,
            one_ve_v0: 0,
            i: null,
        };
    });
    // FIXME proper signal typing
    interactions.signals.on('before-action-end', (arg) => release(arg, scope));
    interactions.signals.on('down', (arg) => resume(arg, scope));
    interactions.signals.on('stop', (arg) => stop(arg));
    defaults.perAction.inertia = {
        enabled: false,
        resistance: 10,
        minSpeed: 100,
        endSpeed: 10,
        allowResume: true,
        smoothEndDuration: 300,
    };
}
function resume({ interaction, event, pointer, eventTarget }, scope) {
    const state = interaction.inertia;
    // Check if the down event hits the current inertia target
    if (state.active) {
        let element = eventTarget;
        // climb up the DOM tree from the event target
        while (utils.is.element(element)) {
            // if interaction element is the current inertia target element
            if (element === interaction.element) {
                // stop inertia
                raf.cancel(state.i);
                state.active = false;
                interaction.simulation = null;
                // update pointers to the down event's coordinates
                interaction.updatePointer(pointer, event, eventTarget, true);
                utils.pointer.setCoords(interaction.coords.cur, interaction.pointers.map((p) => p.pointer));
                // fire appropriate signals
                const signalArg = {
                    interaction,
                };
                scope.interactions.signals.fire('action-resume', signalArg);
                // fire a reume event
                const resumeEvent = new scope.InteractEvent(interaction, event, interaction.prepared.name, EventPhase.Resume, interaction.element);
                interaction._fireEvent(resumeEvent);
                utils.pointer.copyCoords(interaction.coords.prev, interaction.coords.cur);
                break;
            }
            element = utils.dom.parentNode(element);
        }
    }
}
function release({ interaction, event, noPreEnd }, scope) {
    const state = interaction.inertia;
    if (!interaction.interacting() ||
        (interaction.simulation && interaction.simulation.active) ||
        noPreEnd) {
        return null;
    }
    const options = getOptions(interaction);
    const now = new Date().getTime();
    const { client: velocityClient } = interaction.coords.velocity;
    const pointerSpeed = utils.hypot(velocityClient.x, velocityClient.y);
    let smoothEnd = false;
    let modifierResult;
    // check if inertia should be started
    const inertiaPossible = (options && options.enabled &&
        interaction.prepared.name !== 'gesture' &&
        event !== state.startEvent);
    const inertia = (inertiaPossible &&
        (now - interaction.coords.cur.timeStamp) < 50 &&
        pointerSpeed > options.minSpeed &&
        pointerSpeed > options.endSpeed);
    const modifierArg = {
        interaction,
        pageCoords: utils.extend({}, interaction.coords.cur.page),
        states: inertiaPossible && interaction.modifiers.states.map((modifierStatus) => utils.extend({}, modifierStatus)),
        preEnd: true,
        requireEndOnly: true,
    };
    // smoothEnd
    if (inertiaPossible && !inertia) {
        modifierResult = modifiers.setAll(modifierArg);
        if (modifierResult.changed) {
            smoothEnd = true;
        }
    }
    if (!(inertia || smoothEnd)) {
        return null;
    }
    utils.pointer.copyCoords(state.upCoords, interaction.coords.cur);
    interaction.pointers[0].pointer = state.startEvent = new scope.InteractEvent(interaction, event, 
    // FIXME add proper typing Action.name
    interaction.prepared.name, EventPhase.InertiaStart, interaction.element);
    state.t0 = now;
    state.active = true;
    state.allowResume = options.allowResume;
    interaction.simulation = state;
    interaction.target.fire(state.startEvent);
    if (inertia) {
        state.vx0 = interaction.coords.velocity.client.x;
        state.vy0 = interaction.coords.velocity.client.y;
        state.v0 = pointerSpeed;
        calcInertia(interaction, state);
        utils.extend(modifierArg.pageCoords, interaction.coords.cur.page);
        modifierArg.pageCoords.x += state.xe;
        modifierArg.pageCoords.y += state.ye;
        modifierResult = modifiers.setAll(modifierArg);
        state.modifiedXe += modifierResult.delta.x;
        state.modifiedYe += modifierResult.delta.y;
        state.i = raf.request(() => inertiaTick(interaction));
    }
    else {
        state.smoothEnd = true;
        state.xe = modifierResult.delta.x;
        state.ye = modifierResult.delta.y;
        state.sx = state.sy = 0;
        state.i = raf.request(() => smothEndTick(interaction));
    }
    return false;
}
function stop({ interaction }) {
    const state = interaction.inertia;
    if (state.active) {
        raf.cancel(state.i);
        state.active = false;
        interaction.simulation = null;
    }
}
function calcInertia(interaction, state) {
    const options = getOptions(interaction);
    const lambda = options.resistance;
    const inertiaDur = -Math.log(options.endSpeed / state.v0) / lambda;
    state.x0 = interaction.prevEvent.page.x;
    state.y0 = interaction.prevEvent.page.y;
    state.t0 = state.startEvent.timeStamp / 1000;
    state.sx = state.sy = 0;
    state.modifiedXe = state.xe = (state.vx0 - inertiaDur) / lambda;
    state.modifiedYe = state.ye = (state.vy0 - inertiaDur) / lambda;
    state.te = inertiaDur;
    state.lambda_v0 = lambda / state.v0;
    state.one_ve_v0 = 1 - options.endSpeed / state.v0;
}
function inertiaTick(interaction) {
    updateInertiaCoords(interaction);
    utils.pointer.setCoordDeltas(interaction.coords.delta, interaction.coords.prev, interaction.coords.cur);
    utils.pointer.setCoordVelocity(interaction.coords.velocity, interaction.coords.delta);
    const state = interaction.inertia;
    const options = getOptions(interaction);
    const lambda = options.resistance;
    const t = new Date().getTime() / 1000 - state.t0;
    if (t < state.te) {
        const progress = 1 - (Math.exp(-lambda * t) - state.lambda_v0) / state.one_ve_v0;
        if (state.modifiedXe === state.xe && state.modifiedYe === state.ye) {
            state.sx = state.xe * progress;
            state.sy = state.ye * progress;
        }
        else {
            const quadPoint = utils.getQuadraticCurvePoint(0, 0, state.xe, state.ye, state.modifiedXe, state.modifiedYe, progress);
            state.sx = quadPoint.x;
            state.sy = quadPoint.y;
        }
        interaction.move();
        state.i = raf.request(() => inertiaTick(interaction));
    }
    else {
        state.sx = state.modifiedXe;
        state.sy = state.modifiedYe;
        interaction.move();
        interaction.end(state.startEvent);
        state.active = false;
        interaction.simulation = null;
    }
    utils.pointer.copyCoords(interaction.coords.prev, interaction.coords.cur);
}
function smothEndTick(interaction) {
    updateInertiaCoords(interaction);
    const state = interaction.inertia;
    const t = new Date().getTime() - state.t0;
    const { smoothEndDuration: duration } = getOptions(interaction);
    if (t < duration) {
        state.sx = utils.easeOutQuad(t, 0, state.xe, duration);
        state.sy = utils.easeOutQuad(t, 0, state.ye, duration);
        interaction.move();
        state.i = raf.request(() => smothEndTick(interaction));
    }
    else {
        state.sx = state.xe;
        state.sy = state.ye;
        interaction.move();
        interaction.end(state.startEvent);
        state.smoothEnd =
            state.active = false;
        interaction.simulation = null;
    }
}
function updateInertiaCoords(interaction) {
    const state = interaction.inertia;
    // return if inertia isn't running
    if (!state.active) {
        return;
    }
    const pageUp = state.upCoords.page;
    const clientUp = state.upCoords.client;
    utils.pointer.setCoords(interaction.coords.cur, [{
            pageX: pageUp.x + state.sx,
            pageY: pageUp.y + state.sy,
            clientX: clientUp.x + state.sx,
            clientY: clientUp.y + state.sy,
        }]);
}
function getOptions({ target, prepared }) {
    return target && target.options && prepared.name && target.options[prepared.name].inertia;
}
export default {
    install,
    calcInertia,
    inertiaTick,
    smothEndTick,
    updateInertiaCoords,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sZ0NBQWdDLENBQUE7QUFDM0QsT0FBTyxTQUFTLE1BQU0sNEJBQTRCLENBQUE7QUFDbEQsT0FBTyxLQUFLLEtBQUssTUFBTSxtQkFBbUIsQ0FBQTtBQUMxQyxPQUFPLEdBQUcsTUFBTSx1QkFBdUIsQ0FBQTtBQStCdEMsVUFBa0IsQ0FBQyxNQUFNLEdBQUcsUUFBUSxDQUFDO0FBQ3JDLFVBQWtCLENBQUMsWUFBWSxHQUFHLGNBQWMsQ0FBQTtBQUVqRCxTQUFTLE9BQU8sQ0FBRSxLQUFZO0lBQzVCLE1BQU0sRUFDSixZQUFZLEVBQ1osUUFBUSxHQUNULEdBQUcsS0FBSyxDQUFBO0lBRVQsWUFBWSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSxXQUFXLEVBQUUsRUFBRSxFQUFFO1FBQ2pELFdBQVcsQ0FBQyxPQUFPLEdBQUc7WUFDcEIsTUFBTSxFQUFPLEtBQUs7WUFDbEIsU0FBUyxFQUFJLEtBQUs7WUFDbEIsV0FBVyxFQUFFLEtBQUs7WUFFbEIsVUFBVSxFQUFFLElBQUk7WUFDaEIsUUFBUSxFQUFJLEVBQUU7WUFFZCxFQUFFLEVBQUUsQ0FBQztZQUNMLEVBQUUsRUFBRSxDQUFDO1lBQ0wsRUFBRSxFQUFFLENBQUM7WUFDTCxFQUFFLEVBQUUsQ0FBQztZQUVMLEVBQUUsRUFBRSxDQUFDO1lBQ0wsR0FBRyxFQUFFLENBQUM7WUFDTixHQUFHLEVBQUUsQ0FBQztZQUNOLFFBQVEsRUFBRSxDQUFDO1lBRVgsU0FBUyxFQUFFLENBQUM7WUFDWixTQUFTLEVBQUUsQ0FBQztZQUNaLENBQUMsRUFBSSxJQUFJO1NBQ1YsQ0FBQTtJQUNILENBQUMsQ0FBQyxDQUFBO0lBRUYsNkJBQTZCO0lBQzdCLFlBQVksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLG1CQUFt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QUMzRixDQUFDO0FBRUQsZUFBZTtJQUNiLE9BQU87SUFDUCxXQUFXO0lBQ1gsV0FBVztJQUNYLFlBQVk7SUFDWixtQkFBbUI7Q0FDcEIsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEV2ZW50UGhhc2UgfSBmcm9tICdAaW50ZXJhY3Rqcy9jb3JlL0ludGVyYWN0RXZlbnQnXG5pbXBvcnQgbW9kaWZpZXJzIGZyb20gJ0BpbnRlcmFjdGpzL21vZGlmaWVycy9iYXNlJ1xuaW1wb3J0ICogYXMgdXRpbHMgZnJvbSAnQGludGVyYWN0anMvdXRpbHMnXG5pbXBvcnQgcmFmIGZyb20gJ0BpbnRlcmFjdGpzL3V0aWxzL3JhZidcblxudHlwZSBTY29wZSA9IGltcG9ydCAoJ0BpbnRlcmFjdGpzL2NvcmUvc2NvcGUnKS5TY29wZVxuXG5kZWNsYXJlIG1vZHVsZSAnQGludGVyYWN0anMvY29yZS9JbnRlcmFjdEV2ZW50JyB7XG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1zaGFkb3dcbiAgZW51bSBFdmVudFBoYXNlIHtcbiAgICBSZXN1bWUgPSAncmVzdW1lJyxcbiAgICBJbmVydGlhU3RhcnQgPSAnaW5lcnRpYXN0YXJ0JyxcbiAgfVxufVxuXG5kZWNsYXJlIG1vZHVsZSAnQGludGVyYWN0anMvY29yZS9JbnRlcmFjdGlvbicge1xuICBpbnRlcmZhY2UgSW50ZXJhY3Rpb24ge1xuICAgIGluZXJ0aWE/OiBhbnlcbiAgfVxufVxuXG5kZWNsYXJlIG1vZHVsZSAnQGludGVyYWN0anMvY29yZS9kZWZhdWx0T3B0aW9ucycge1xuICBpbnRlcmZhY2UgUGVyQWN0aW9uRGVmYXVsdHMge1xuICAgIGluZXJ0aWE/OiB7XG4gICAgICBlbmFibGVkPzogYm9vbGVhbixcbiAgICAgIHJlc2lzdGFuY2U/OiBudW1iZXIsICAgICAgICAvLyB0aGUgbGFtYmRhIGluIGV4cG9uZW50aWFsIGRlY2F5XG4gICAgICBtaW5TcGVlZD86IG51bWJlciwgICAgICAgICAgLy8gdGFyZ2V0IHNwZWVkIG11c3QgYmUgYWJvdmUgdGhpcyBmb3IgaW5lcnRpYSB0byBzdGFydFxuICAgICAgZW5kU3BlZWQ/OiBudW1iZXIsICAgICAgICAgIC8vIHRoZSBzcGVlZCBhdCB3aGljaCBpbmVydGlhIGlzIHNsb3cgZW5vdWdoIHRvIHN0b3BcbiAgICAgIGFsbG93UmVzdW1lPzogdHJ1ZSwgICAgICAgICAvLyBhbGxvdyByZXN1bWluZyBhbiBhY3Rpb24gaW4gaW5lcnRpYSBwaGFzZVxuICAgICAgc21vb3RoRW5kRHVyYXRpb24/OiBudW1iZXIsIC8vIGFuaW1hdGUgdG8gc25hcC9yZXN0cmljdCBlbmRPbmx5IGlmIHRoZXJlJ3Mgbm8gaW5lcnRpYVxuICAgIH0gfCBib29sZWFuIC8vIEZJWE1FXG4gIH1cbn1cblxuKEV2ZW50UGhhc2UgYXMgYW55KS5SZXN1bWUgPSAncmVzdW1lJztcbihFdmVudFBoYXNlIGFzIGFueSkuSW5lcnRpYVN0YXJ0ID0gJ2luZXJ0aWFzdGFydCdcblxuZnVuY3Rpb24gaW5zdGFsbCAoc2NvcGU6IFNjb3BlKSB7XG4gIGNvbnN0IHtcbiAgICBpbnRlcmFjdGlvbnMsXG4gICAgZGVmYXVsdHMsXG4gIH0gPSBzY29wZVxuXG4gIGludGVyYWN0aW9ucy5zaWduYWxzLm9uKCduZXcnLCAoeyBpbnRlcmFjdGlvbiB9KSA9PiB7XG4gICAgaW50ZXJhY3Rpb24uaW5lcnRpYSA9IHtcbiAgICAgIGFjdGl2ZSAgICAgOiBmYWxzZSxcbiAgICAgIHNtb290aEVuZCAgOiBmYWxzZSxcbiAgICAgIGFsbG93UmVzdW1lOiBmYWxzZSxcblxuICAgICAgc3RhcnRFdmVudDogbnVsbCxcbiAgICAgIHVwQ29vcmRzICA6IHt9LFxuXG4gICAgICB4ZTogMCxcbiAgICAgIHllOiAwLFxuICAgICAgc3g6IDAsXG4gICAgICBzeTogMCxcblxuICAgICAgdDA6IDAsXG4gICAgICB2eDA6IDAsXG4gICAgICB2eXM6IDAsXG4gICAgICBkdXJhdGlvbjogMCxcblxuICAgICAgbGFtYmRhX3YwOiAwLFxuICAgICAgb25lX3ZlX3YwOiAwLFxuICAgICAgaSAgOiBudWxsLFxuICAgIH1cbiAgfSlcblxuICAvLyBGSVhNRSBwcm9wZXIgc2lnbmFsIHR5cGluZ1xuICBpbnRlcmFjdGlvbnMuc2lnbmFscy5vbignYmVmb3JlLWFjdGlvbi1lbmQnLCAoYXJnKSA9PiByZWxlYXNlKGFyZyBhcyBhbnksIHNjb3BlKSlcbiAgaW50ZXJhY3Rpb25zLnNpZ25hbHMub24oJ2Rvd24nLCAoYXJnKSA9PiByZXN1bWUoYXJnIGFzIGFueSwgc2NvcGUpKVxuICBpbnRlcmFjdGlvbnMuc2lnbmFscy5vbignc3RvcCcsIChhcmcpID0+IHN0b3AoYXJnIGFzIGFueSkpXG5cbiAgZGVmYXVsdHMucGVyQWN0aW9uLmluZXJ0aWEgPSB7XG4gICAgZW5hYmxlZCAgICAgICAgICA6IGZhbHNlLFxuICAgIHJlc2lzdGFuY2UgICAgICAgOiAxMCwgICAgLy8gdGhlIGxhbWJkYSBpbiBleHBvbmVudGlhbCBkZWNheVxuICAgIG1pblNwZWVkICAgICAgICAgOiAxMDAsICAgLy8gdGFyZ2V0IHNwZWVkIG11c3QgYmUgYWJvdmUgdGhpcyBmb3IgaW5lcnRpYSB0byBzdGFydFxuICAgIGVuZFNwZWVkICAgICAgICAgOiAxMCwgICAgLy8gdGhlIHNwZWVkIGF0IHdoaWNoIGluZXJ0aWEgaXMgc2xvdyBlbm91Z2ggdG8gc3RvcFxuICAgIGFsbG93UmVzdW1lICAgICAgOiB0cnVlLCAgLy8gYWxsb3cgcmVzdW1pbmcgYW4gYWN0aW9uIGluIGluZXJ0aWEgcGhhc2VcbiAgICBzbW9vdGhFbmREdXJhdGlvbjogMzAwLCAgIC8vIGFuaW1hdGUgdG8gc25hcC9yZXN0cmljdCBlbmRPbmx5IGlmIHRoZXJlJ3Mgbm8gaW5lcnRpYVxuICB9XG59XG5cbmZ1bmN0aW9uIHJlc3VtZSAoeyBpbnRlcmFjdGlvbiwgZXZlbnQsIHBvaW50ZXIsIGV2ZW50VGFyZ2V0IH06IEludGVyYWN0LlNpZ25hbEFyZywgc2NvcGU6IFNjb3BlKSB7XG4gIGNvbnN0IHN0YXRlID0gaW50ZXJhY3Rpb24uaW5lcnRpYVxuXG4gIC8vIENoZWNrIGlmIHRoZSBkb3duIGV2ZW50IGhpdHMgdGhlIGN1cnJlbnQgaW5lcnRpYSB0YXJnZXRcbiAgaWYgKHN0YXRlLmFjdGl2ZSkge1xuICAgIGxldCBlbGVtZW50ID0gZXZlbnRUYXJnZXRcblxuICAgIC8vIGNsaW1iIHVwIHRoZSBET00gdHJlZSBmcm9tIHRoZSBldmVudCB0YXJnZXRcbiAgICB3aGlsZSAodXRpbHMuaXMuZWxlbWVudChlbGVtZW50KSkge1xuICAgICAgLy8gaWYgaW50ZXJhY3Rpb24gZWxlbWVudCBpcyB0aGUgY3VycmVudCBpbmVydGlhIHRhcmdldCBlbGVtZW50XG4gICAgICBpZiAoZWxlbWVudCA9PT0gaW50ZXJhY3Rpb24uZWxlbWVudCkge1xuICAgICAgICAvLyBzdG9wIGluZXJ0aWFcbiAgICAgICAgcmFmLmNhbmNlbChzdGF0ZS5pKVxuICAgICAgICBzdGF0ZS5hY3RpdmUgPSBmYWxzZVxuICAgICAgICBpbnRlcmFjdGlvbi5zaW11bGF0aW9uID0gbnVsbFxuXG4gICAgICAgIC8vIHVwZGF0ZSBwb2ludGVycyB0byB0aGUgZG93biBldmVudCdzIGNvb3JkaW5hdGVzXG4gICAgICAgIGludGVyYWN0aW9uLnVwZGF0ZVBvaW50ZXIocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0LCB0cnVlKVxuICAgICAgICB1dGlscy5wb2ludGVyLnNldENvb3JkcyhcbiAgICAgICAgICBpbnRlcmFjdGlvbi5jb29yZHMuY3VyLFxuICAgICAgICAgIGludGVyYWN0aW9uLnBvaW50ZXJzLm1hcCgocCkgPT4gcC5wb2ludGVyKVxuICAgICAgICApXG5cbiAgICAgICAgLy8gZmlyZSBhcHByb3ByaWF0ZSBzaWduYWxzXG4gICAgICAgIGNvbnN0IHNpZ25hbEFyZyA9IHtcbiAgICAgICAgICBpbnRlcmFjdGlvbixcbiAgICAgICAgfVxuXG4gICAgICAgIHNjb3BlLmludGVyYWN0aW9ucy5zaWduYWxzLmZpcmUoJ2FjdGlvbi1yZXN1bWUnLCBzaWduYWxBcmcpXG5cbiAgICAgICAgLy8gZmlyZSBhIHJldW1lIGV2ZW50XG4gICAgICAgIGNvbnN0IHJlc3VtZUV2ZW50ID0gbmV3IHNjb3BlLkludGVyYWN0RXZlbnQoXG4gICAgICAgICAgaW50ZXJhY3Rpb24sIGV2ZW50LCBpbnRlcmFjdGlvbi5wcmVwYXJlZC5uYW1lLCBFdmVudFBoYXNlLlJlc3VtZSwgaW50ZXJhY3Rpb24uZWxlbWVudClcblxuICAgICAgICBpbnRlcmFjdGlvbi5fZmlyZUV2ZW50KHJlc3VtZUV2ZW50KVxuXG4gICAgICAgIHV0aWxzLnBvaW50ZXIuY29weUNvb3JkcyhpbnRlcmFjdGlvbi5jb29yZHMucHJldiwgaW50ZXJhY3Rpb24uY29vcmRzLmN1cilcbiAgICAgICAgYnJlYWtcbiAgICAgIH1cblxuICAgICAgZWxlbWVudCA9IHV0aWxzLmRvbS5wYXJlbnROb2RlKGVsZW1lbnQpXG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIHJlbGVhc2U8VCBleHRlbmRzIEludGVyYWN0LkFjdGlvbk5hbWU+ICh7IGludGVyYWN0aW9uLCBldmVudCwgbm9QcmVFbmQgfTogSW50ZXJhY3QuU2lnbmFsQXJnLCBzY29wZTogU2NvcGUpIHtcbiAgY29uc3Qgc3RhdGUgPSBpbnRlcmFjdGlvbi5pbmVydGlhXG5cbiAgaWYgKCFpbnRlcmFjdGlvbi5pbnRlcmFjdGluZygpIHx8XG4gICAgKGludGVyYWN0aW9uLnNpbXVsYXRpb24gJiYgaW50ZXJhY3Rpb24uc2ltdWxhdGlvbi5hY3RpdmUpIHx8XG4gIG5vUHJlRW5kKSB7XG4gICAgcmV0dXJuIG51bGxcbiAgfVxuXG4gIGNvbnN0IG9wdGlvbnMgPSBnZXRPcHRpb25zKGludGVyYWN0aW9uKVxuXG4gIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpXG4gIGNvbnN0IHsgY2xpZW50OiB2ZWxvY2l0eUNsaWVudCB9ID0gaW50ZXJhY3Rpb24uY29vcmRzLnZlbG9jaXR5XG4gIGNvbnN0IHBvaW50ZXJTcGVlZCA9IHV0aWxzLmh5cG90KHZlbG9jaXR5Q2xpZW50LngsIHZlbG9jaXR5Q2xpZW50LnkpXG5cbiAgbGV0IHNtb290aEVuZCA9IGZhbHNlXG4gIGxldCBtb2RpZmllclJlc3VsdDogUmV0dXJuVHlwZTx0eXBlb2YgbW9kaWZpZXJzLnNldEFsbD5cblxuICAvLyBjaGVjayBpZiBpbmVydGlhIHNob3VsZCBiZSBzdGFydGVkXG4gIGNvbnN0IGluZXJ0aWFQb3NzaWJsZSA9IChvcHRpb25zICYmIG9wdGlvbnMuZW5hYmxlZCAmJlxuICAgICAgICAgICAgICAgICAgICAgaW50ZXJhY3Rpb24ucHJlcGFyZWQubmFtZSAhPT0gJ2dlc3R1cmUnICYmXG4gICAgICAgICAgICAgICAgICAgICBldmVudCAhPT0gc3RhdGUuc3RhcnRFdmVudClcblxuICBjb25zdCBpbmVydGlhID0gKGluZXJ0aWFQb3NzaWJsZSAmJlxuICAgIChub3cgLSBpbnRlcmFjdGlvbi5jb29yZHMuY3VyLnRpbWVTdGFtcCkgPCA1MCAmJlxuICAgIHBvaW50ZXJTcGVlZCA+IG9wdGlvbnMubWluU3BlZWQgJiZcbiAgICBwb2ludGVyU3BlZWQgPiBvcHRpb25zLmVuZFNwZWVkKVxuXG4gIGNvbnN0IG1vZGlmaWVyQXJnID0ge1xuICAgIGludGVyYWN0aW9uLFxuICAgIHBhZ2VDb29yZHM6IHV0aWxzLmV4dGVuZCh7fSwgaW50ZXJhY3Rpb24uY29vcmRzLmN1ci5wYWdlKSxcbiAgICBzdGF0ZXM6IGluZXJ0aWFQb3NzaWJsZSAmJiBpbnRlcmFjdGlvbi5tb2RpZmllcnMuc3RhdGVzLm1hcChcbiAgICAgIChtb2RpZmllclN0YXR1cykgPT4gdXRpbHMuZXh0ZW5kKHt9LCBtb2RpZmllclN0YXR1cylcbiAgICApLFxuICAgIHByZUVuZDogdHJ1ZSxcbiAgICByZXF1aXJlRW5kT25seTogdHJ1ZSxcbiAgfVxuXG4gIC8vIHNtb290aEVuZFxuICBpZiAoaW5lcnRpYVBvc3NpYmxlICYmICFpbmVydGlhKSB7XG4gICAgbW9kaWZpZXJSZXN1bHQgPSBtb2RpZmllcnMuc2V0QWxsKG1vZGlmaWVyQXJnKVxuXG4gICAgaWYgKG1vZGlmaWVyUmVzdWx0LmNoYW5nZWQpIHtcbiAgICAgIHNtb290aEVuZCA9IHRydWVcbiAgICB9XG4gIH1cblxuICBpZiAoIShpbmVydGlhIHx8IHNtb290aEVuZCkpIHsgcmV0dXJuIG51bGwgfVxuXG4gIHV0aWxzLnBvaW50ZXIuY29weUNvb3JkcyhzdGF0ZS51cENvb3JkcywgaW50ZXJhY3Rpb24uY29vcmRzLmN1cilcblxuICBpbnRlcmFjdGlvbi5wb2ludGVyc1swXS5wb2ludGVyID0gc3RhdGUuc3RhcnRFdmVudCA9IG5ldyBzY29wZS5JbnRlcmFjdEV2ZW50KFxuICAgIGludGVyYWN0aW9uLFxuICAgIGV2ZW50LFxuICAgIC8vIEZJWE1FIGFkZCBwcm9wZXIgdHlwaW5nIEFjdGlvbi5uYW1lXG4gICAgaW50ZXJhY3Rpb24ucHJlcGFyZWQubmFtZSBhcyBULFxuICAgIEV2ZW50UGhhc2UuSW5lcnRpYVN0YXJ0LFxuICAgIGludGVyYWN0aW9uLmVsZW1lbnQsXG4gIClcblxuICBzdGF0ZS50MCA9IG5vd1xuXG4gIHN0YXRlLmFjdGl2ZSA9IHRydWVcbiAgc3RhdGUuYWxsb3dSZXN1bWUgPSBvcHRpb25zLmFsbG93UmVzdW1lXG4gIGludGVyYWN0aW9uLnNpbXVsYXRpb24gPSBzdGF0ZVxuXG4gIGludGVyYWN0aW9uLnRhcmdldC5maXJlKHN0YXRlLnN0YXJ0RXZlbnQpXG5cbiAgaWYgKGluZXJ0aWEpIHtcbiAgICBzdGF0ZS52eDAgPSBpbnRlcmFjdGlvbi5jb29yZHMudmVsb2NpdHkuY2xpZW50LnhcbiAgICBzdGF0ZS52eTAgPSBpbnRlcmFjdGlvbi5jb29yZHMudmVsb2NpdHkuY2xpZW50LnlcbiAgICBzdGF0ZS52MCA9IHBvaW50ZXJTcGVlZFxuXG4gICAgY2FsY0luZXJ0aWEoaW50ZXJhY3Rpb24sIHN0YXRlKVxuXG4gICAgdXRpbHMuZXh0ZW5kKG1vZGlmaWVyQXJnLnBhZ2VDb29yZHMsIGludGVyYWN0aW9uLmNvb3Jkcy5jdXIucGFnZSlcblxuICAgIG1vZGlmaWVyQXJnLnBhZ2VDb29yZHMueCArPSBzdGF0ZS54ZVxuICAgIG1vZGlmaWVyQXJnLnBhZ2VDb29yZHMueSArPSBzdGF0ZS55ZVxuXG4gICAgbW9kaWZpZXJSZXN1bHQgPSBtb2RpZmllcnMuc2V0QWxsKG1vZGlmaWVyQXJnKVxuXG4gICAgc3RhdGUubW9kaWZpZWRYZSArPSBtb2RpZmllclJlc3VsdC5kZWx0YS54XG4gICAgc3RhdGUubW9kaWZpZWRZZSArPSBtb2RpZmllclJlc3VsdC5kZWx0YS55XG5cbiAgICBzdGF0ZS5pID0gcmFmLnJlcXVlc3QoKCkgPT4gaW5lcnRpYVRpY2soaW50ZXJhY3Rpb24pKVxuICB9XG4gIGVsc2Uge1xuICAgIHN0YXRlLnNtb290aEVuZCA9IHRydWVcbiAgICBzdGF0ZS54ZSA9IG1vZGlmaWVyUmVzdWx0LmRlbHRhLnhcbiAgICBzdGF0ZS55ZSA9IG1vZGlmaWVyUmVzdWx0LmRlbHRhLnlcblxuICAgIHN0YXRlLnN4ID0gc3RhdGUuc3kgPSAwXG5cbiAgICBzdGF0ZS5pID0gcmFmLnJlcXVlc3QoKCkgPT4gc21vdGhFbmRUaWNrKGludGVyYWN0aW9uKSlcbiAgfVxuXG4gIHJldHVybiBmYWxzZVxufVxuXG5mdW5jdGlvbiBzdG9wICh7IGludGVyYWN0aW9uIH06IEludGVyYWN0LlNpZ25hbEFyZykge1xuICBjb25zdCBzdGF0ZSA9IGludGVyYWN0aW9uLmluZXJ0aWFcbiAgaWYgKHN0YXRlLmFjdGl2ZSkge1xuICAgIHJhZi5jYW5jZWwoc3RhdGUuaSlcbiAgICBzdGF0ZS5hY3RpdmUgPSBmYWxzZVxuICAgIGludGVyYWN0aW9uLnNpbXVsYXRpb24gPSBudWxsXG4gIH1cbn1cblxuZnVuY3Rpb24gY2FsY0luZXJ0aWEgKGludGVyYWN0aW9uOiBJbnRlcmFjdC5JbnRlcmFjdGlvbiwgc3RhdGUpIHtcbiAgY29uc3Qgb3B0aW9ucyA9IGdldE9wdGlvbnMoaW50ZXJhY3Rpb24pXG4gIGNvbnN0IGxhbWJkYSA9IG9wdGlvbnMucmVzaXN0YW5jZVxuICBjb25zdCBpbmVydGlhRHVyID0gLU1hdGgubG9nKG9wdGlvbnMuZW5kU3BlZWQgLyBzdGF0ZS52MCkgLyBsYW1iZGFcblxuICBzdGF0ZS54MCA9IGludGVyYWN0aW9uLnByZXZFdmVudC5wYWdlLnhcbiAgc3RhdGUueTAgPSBpbnRlcmFjdGlvbi5wcmV2RXZlbnQucGFnZS55XG4gIHN0YXRlLnQwID0gc3RhdGUuc3RhcnRFdmVudC50aW1lU3RhbXAgLyAxMDAwXG4gIHN0YXRlLnN4ID0gc3RhdGUuc3kgPSAwXG5cbiAgc3RhdGUubW9kaWZpZWRYZSA9IHN0YXRlLnhlID0gKHN0YXRlLnZ4MCAtIGluZXJ0aWFEdXIpIC8gbGFtYmRhXG4gIHN0YXRlLm1vZGlmaWVkWWUgPSBzdGF0ZS55ZSA9IChzdGF0ZS52eTAgLSBpbmVydGlhRHVyKSAvIGxhbWJkYVxuICBzdGF0ZS50ZSA9IGluZXJ0aWFEdXJcblxuICBzdGF0ZS5sYW1iZGFfdjAgPSBsYW1iZGEgLyBzdGF0ZS52MFxuICBzdGF0ZS5vbmVfdmVfdjAgPSAxIC0gb3B0aW9ucy5lbmRTcGVlZCAvIHN0YXRlLnYwXG59XG5cbmZ1bmN0aW9uIGluZXJ0aWFUaWNrIChpbnRlcmFjdGlvbjogSW50ZXJhY3QuSW50ZXJhY3Rpb24pIHtcbiAgdXBkYXRlSW5lcnRpYUNvb3JkcyhpbnRlcmFjdGlvbilcbiAgdXRpbHMucG9pbnRlci5zZXRDb29yZERlbHRhcyhpbnRlcmFjdGlvbi5jb29yZHMuZGVsdGEsIGludGVyYWN0aW9uLmNvb3Jkcy5wcmV2LCBpbnRlcmFjdGlvbi5jb29yZHMuY3VyKVxuICB1dGlscy5wb2ludGVyLnNldENvb3JkVmVsb2NpdHkoaW50ZXJhY3Rpb24uY29vcmRzLnZlbG9jaXR5LCBpbnRlcmFjdGlvbi5jb29yZHMuZGVsdGEpXG5cbiAgY29uc3Qgc3RhdGUgPSBpbnRlcmFjdGlvbi5pbmVydGlhXG4gIGNvbnN0IG9wdGlvbnMgPSBnZXRPcHRpb25zKGludGVyYWN0aW9uKVxuICBjb25zdCBsYW1iZGEgPSBvcHRpb25zLnJlc2lzdGFuY2VcbiAgY29uc3QgdCA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpIC8gMTAwMCAtIHN0YXRlLnQwXG5cbiAgaWYgKHQgPCBzdGF0ZS50ZSkge1xuICAgIGNvbnN0IHByb2dyZXNzID0gIDEgLSAoTWF0aC5leHAoLWxhbWJkYSAqIHQpIC0gc3RhdGUubGFtYmRhX3YwKSAvIHN0YXRlLm9uZV92ZV92MFxuXG4gICAgaWYgKHN0YXRlLm1vZGlmaWVkWGUgPT09IHN0YXRlLnhlICYmIHN0YXRlLm1vZGlmaWVkWWUgPT09IHN0YXRlLnllKSB7XG4gICAgICBzdGF0ZS5zeCA9IHN0YXRlLnhlICogcHJvZ3Jlc3NcbiAgICAgIHN0YXRlLnN5ID0gc3RhdGUueWUgKiBwcm9ncmVzc1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGNvbnN0IHF1YWRQb2ludCA9IHV0aWxzLmdldFF1YWRyYXRpY0N1cnZlUG9pbnQoXG4gICAgICAgIDAsIDAsXG4gICAgICAgIHN0YXRlLnhlLCBzdGF0ZS55ZSxcbiAgICAgICAgc3RhdGUubW9kaWZpZWRYZSwgc3RhdGUubW9kaWZpZWRZZSxcbiAgICAgICAgcHJvZ3Jlc3MpXG5cbiAgICAgIHN0YXRlLnN4ID0gcXVhZFBvaW50LnhcbiAgICAgIHN0YXRlLnN5ID0gcXVhZFBvaW50LnlcbiAgICB9XG5cbiAgICBpbnRlcmFjdGlvbi5tb3ZlKClcblxuICAgIHN0YXRlLmkgPSByYWYucmVxdWVzdCgoKSA9PiBpbmVydGlhVGljayhpbnRlcmFjdGlvbikpXG4gIH1cbiAgZWxzZSB7XG4gICAgc3RhdGUuc3ggPSBzdGF0ZS5tb2RpZmllZFhlXG4gICAgc3RhdGUuc3kgPSBzdGF0ZS5tb2RpZmllZFllXG5cbiAgICBpbnRlcmFjdGlvbi5tb3ZlKClcbiAgICBpbnRlcmFjdGlvbi5lbmQoc3RhdGUuc3RhcnRFdmVudClcbiAgICBzdGF0ZS5hY3RpdmUgPSBmYWxzZVxuICAgIGludGVyYWN0aW9uLnNpbXVsYXRpb24gPSBudWxsXG4gIH1cblxuICB1dGlscy5wb2ludGVyLmNvcHlDb29yZHMoaW50ZXJhY3Rpb24uY29vcmRzLnByZXYsIGludGVyYWN0aW9uLmNvb3Jkcy5jdXIpXG59XG5cbmZ1bmN0aW9uIHNtb3RoRW5kVGljayAoaW50ZXJhY3Rpb246IEludGVyYWN0LkludGVyYWN0aW9uKSB7XG4gIHVwZGF0ZUluZXJ0aWFDb29yZHMoaW50ZXJhY3Rpb24pXG5cbiAgY29uc3Qgc3RhdGUgPSBpbnRlcmFjdGlvbi5pbmVydGlhXG4gIGNvbnN0IHQgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKSAtIHN0YXRlLnQwXG4gIGNvbnN0IHsgc21vb3RoRW5kRHVyYXRpb246IGR1cmF0aW9uIH0gPSBnZXRPcHRpb25zKGludGVyYWN0aW9uKVxuXG4gIGlmICh0IDwgZHVyYXRpb24pIHtcbiAgICBzdGF0ZS5zeCA9IHV0aWxzLmVhc2VPdXRRdWFkKHQsIDAsIHN0YXRlLnhlLCBkdXJhdGlvbilcbiAgICBzdGF0ZS5zeSA9IHV0aWxzLmVhc2VPdXRRdWFkKHQsIDAsIHN0YXRlLnllLCBkdXJhdGlvbilcblxuICAgIGludGVyYWN0aW9uLm1vdmUoKVxuXG4gICAgc3RhdGUuaSA9IHJhZi5yZXF1ZXN0KCgpID0+IHNtb3RoRW5kVGljayhpbnRlcmFjdGlvbikpXG4gIH1cbiAgZWxzZSB7XG4gICAgc3RhdGUuc3ggPSBzdGF0ZS54ZVxuICAgIHN0YXRlLnN5ID0gc3RhdGUueWVcblxuICAgIGludGVyYWN0aW9uLm1vdmUoKVxuICAgIGludGVyYWN0aW9uLmVuZChzdGF0ZS5zdGFydEV2ZW50KVxuXG4gICAgc3RhdGUuc21vb3RoRW5kID1cbiAgICAgIHN0YXRlLmFjdGl2ZSA9IGZhbHNlXG4gICAgaW50ZXJhY3Rpb24uc2ltdWxhdGlvbiA9IG51bGxcbiAgfVxufVxuXG5mdW5jdGlvbiB1cGRhdGVJbmVydGlhQ29vcmRzIChpbnRlcmFjdGlvbjogSW50ZXJhY3QuSW50ZXJhY3Rpb24pIHtcbiAgY29uc3Qgc3RhdGUgPSBpbnRlcmFjdGlvbi5pbmVydGlhXG5cbiAgLy8gcmV0dXJuIGlmIGluZXJ0aWEgaXNuJ3QgcnVubmluZ1xuICBpZiAoIXN0YXRlLmFjdGl2ZSkgeyByZXR1cm4gfVxuXG4gIGNvbnN0IHBhZ2VVcCAgID0gc3RhdGUudXBDb29yZHMucGFnZVxuICBjb25zdCBjbGllbnRVcCA9IHN0YXRlLnVwQ29vcmRzLmNsaWVudFxuXG4gIHV0aWxzLnBvaW50ZXIuc2V0Q29vcmRzKGludGVyYWN0aW9uLmNvb3Jkcy5jdXIsIFsge1xuICAgIHBhZ2VYICA6IHBhZ2VVcC54ICAgKyBzdGF0ZS5zeCxcbiAgICBwYWdlWSAgOiBwYWdlVXAueSAgICsgc3RhdGUuc3ksXG4gICAgY2xpZW50WDogY2xpZW50VXAueCArIHN0YXRlLnN4LFxuICAgIGNsaWVudFk6IGNsaWVudFVwLnkgKyBzdGF0ZS5zeSxcbiAgfSBdKVxufVxuXG5mdW5jdGlvbiBnZXRPcHRpb25zICh7IHRhcmdldCwgcHJlcGFyZWQgfSkge1xuICByZXR1cm4gdGFyZ2V0ICYmIHRhcmdldC5vcHRpb25zICYmIHByZXBhcmVkLm5hbWUgJiYgdGFyZ2V0Lm9wdGlvbnNbcHJlcGFyZWQubmFtZV0uaW5lcnRpYVxufVxuXG5leHBvcnQgZGVmYXVsdCB7XG4gIGluc3RhbGwsXG4gIGNhbGNJbmVydGlhLFxuICBpbmVydGlhVGljayxcbiAgc21vdGhFbmRUaWNrLFxuICB1cGRhdGVJbmVydGlhQ29vcmRzLFxufVxuIl19