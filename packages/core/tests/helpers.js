import { doc } from '@interactjs/_dev/test/domator';
import * as utils from '@interactjs/utils';
import Signals from '@interactjs/utils/Signals';
import Eventable from '../Eventable';
import { createScope } from '../scope';
let counter = 0;
export function unique() {
    return (counter++);
}
export function uniqueProps(obj) {
    for (const prop in obj) {
        if (!obj.hasOwnProperty(prop)) {
            continue;
        }
        if (utils.is.object(obj)) {
            uniqueProps(obj[prop]);
        }
        else {
            obj[prop] = (counter++);
        }
    }
}
export function newCoordsSet(n = 0) {
    return {
        start: {
            page: { x: n++, y: n++ },
            client: { x: n++, y: n++ },
            timeStamp: n++,
        },
        cur: {
            page: { x: n++, y: n++ },
            client: { x: n++, y: n++ },
            timeStamp: n++,
        },
        prev: {
            page: { x: n++, y: n++ },
            client: { x: n++, y: n++ },
            timeStamp: n++,
        },
        delta: {
            page: { x: n++, y: n++ },
            client: { x: n++, y: n++ },
            timeStamp: n++,
        },
        velocity: {
            page: { x: n++, y: n++ },
            client: { x: n++, y: n++ },
            timeStamp: n++,
        },
    };
}
export function newPointer(n = 50) {
    return {
        pointerId: n++,
        pageX: n++,
        pageY: n++,
        clientX: n++,
        clientY: n++,
    };
}
export function mockScope(options = {}) {
    const document = options.document || doc;
    const window = document.defaultView;
    const scope = createScope().init(window);
    scope.interact = Object.assign(() => { }, { use() { } });
    return scope;
}
export function mockSignals() {
    return {
        on() { },
        off() { },
        fire() { },
    };
}
export function mockInteractable(props = {}) {
    return Object.assign({
        _signals: new Signals(),
        _actions: {
            names: [],
            methodDict: {},
        },
        options: {
            deltaSource: 'page',
        },
        target: {},
        events: new Eventable(),
        getRect() {
            return this.element
                ? utils.dom.getElementClientRect(this.element)
                : { left: 0, top: 0, right: 0, bottom: 0 };
        },
        fire(event) {
            this.events.fire(event);
        },
    }, props);
}
export function getProps(src, props) {
    return props.reduce((acc, prop) => {
        acc[prop] = src[prop];
        return acc;
    }, {});
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGVscGVycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImhlbHBlcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLEdBQUcsRUFBRSxNQUFNLCtCQUErQixDQUFBO0FBQ25ELE9BQU8sS0FBSyxLQUFLLE1BQU0sbUJBQW1CLENBQUE7QUFDMUMsT0FBTyxPQUFPLE1BQU0sMkJBQTJCLENBQUE7QUFDL0MsT0FBTyxTQUFTLE1BQU0sY0FBYyxDQUFBO0FBQ3BDLE9BQU8sRUFBRSxXQUFXLEVBQUUsTUFBTSxVQUFVLENBQUE7QUFFdEMsSUFBSSxPQUFPLEdBQUcsQ0FBQyxDQUFBO0FBRWYsTUFBTSxVQUFVLE1BQU07SUFDcEIsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUE7QUFDcEIsQ0FBQztBQUVELE1BQU0sVUFBVSxXQUFXLENBQUUsR0FBRztJQUM5QixLQUFLLE1BQU0sSUFBSSxJQUFJLEdBQUcsRUFBRTtRQUN0QixJQUFJLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUFFLFNBQVE7U0FBRTtRQUUzQyxJQUFJLEtBQUssQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFFO1lBQ3hCLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQTtTQUN2QjthQUNJO1lBQ0gsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQTtTQUN4QjtLQUNGO0FBQ0gsQ0FBQztBQUVELE1BQU0sVUFBVSxZQUFZLENBQUUsQ0FBQyxHQUFHLENBQUM7SUFDakMsT0FBTztRQUNMLEtBQUssRUFBRTtZQUNMLElBQUksRUFBTyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDN0IsTUFBTSxFQUFLLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVB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QU8sQ0FBQztnQkFDOUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFBO1FBQzlDLENBQUM7UUFDRCxJQUFJLENBQUUsS0FBSztZQUNULElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFBO1FBQ3pCLENBQUM7S0FDRixFQUNELEtBQUssQ0FBUSxDQUFBO0FBQ2pCLENBQUM7QUFFRCxNQUFNLFVBQVUsUUFBUSxDQUFFLEdBQUcsRUFBRSxLQUFLO0lBQ2xDLE9BQU8sS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUUsRUFBRTtRQUNoQyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFBO1FBQ3JCLE9BQU8sR0FBRyxDQUFBO0lBQ1osQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFBO0FBQ1IsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGRvYyB9IGZyb20gJ0BpbnRlcmFjdGpzL19kZXYvdGVzdC9kb21hdG9yJ1xuaW1wb3J0ICogYXMgdXRpbHMgZnJvbSAnQGludGVyYWN0anMvdXRpbHMnXG5pbXBvcnQgU2lnbmFscyBmcm9tICdAaW50ZXJhY3Rqcy91dGlscy9TaWduYWxzJ1xuaW1wb3J0IEV2ZW50YWJsZSBmcm9tICcuLi9FdmVudGFibGUnXG5pbXBvcnQgeyBjcmVhdGVTY29wZSB9IGZyb20gJy4uL3Njb3BlJ1xuXG5sZXQgY291bnRlciA9IDBcblxuZXhwb3J0IGZ1bmN0aW9uIHVuaXF1ZSAoKSB7XG4gIHJldHVybiAoY291bnRlcisrKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gdW5pcXVlUHJvcHMgKG9iaikge1xuICBmb3IgKGNvbnN0IHByb3AgaW4gb2JqKSB7XG4gICAgaWYgKCFvYmouaGFzT3duUHJvcGVydHkocHJvcCkpIHsgY29udGludWUgfVxuXG4gICAgaWYgKHV0aWxzLmlzLm9iamVjdChvYmopKSB7XG4gICAgICB1bmlxdWVQcm9wcyhvYmpbcHJvcF0pXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgb2JqW3Byb3BdID0gKGNvdW50ZXIrKylcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG5ld0Nvb3Jkc1NldCAobiA9IDApIHtcbiAgcmV0dXJuIHtcbiAgICBzdGFydDoge1xuICAgICAgcGFnZSAgICAgOiB7IHg6IG4rKywgeTogbisrIH0sXG4gICAgICBjbGllbnQgICA6IHsgeDogbisrLCB5OiBuKysgfSxcbiAgICAgIHRpbWVTdGFtcDogbisrLFxuICAgIH0sXG4gICAgY3VyOiB7XG4gICAgICBwYWdlICAgICA6IHsgeDogbisrLCB5OiBuKysgfSxcbiAgICAgIGNsaWVudCAgIDogeyB4OiBuKyssIHk6IG4rKyB9LFxuICAgICAgdGltZVN0YW1wOiBuKyssXG4gICAgfSxcbiAgICBwcmV2OiB7XG4gICAgICBwYWdlICAgICA6IHsgeDogbisrLCB5OiBuKysgfSxcbiAgICAgIGNsaWVudCAgIDogeyB4OiBuKyssIHk6IG4rKyB9LFxuICAgICAgdGltZVN0YW1wOiBuKyssXG4gICAgfSxcbiAgICBkZWx0YToge1xuICAgICAgcGFnZSAgICAgOiB7IHg6IG4rKywgeTogbisrIH0sXG4gICAgICBjbGllbnQgICA6IHsgeDogbisrLCB5OiBuKysgfSxcbiAgICAgIHRpbWVTdGFtcDogbisrLFxuICAgIH0sXG4gICAgdmVsb2NpdHk6IHtcbiAgICAgIHBhZ2UgICAgIDogeyB4OiBuKyssIHk6IG4rKyB9LFxuICAgICAgY2xpZW50ICAgOiB7IHg6IG4rKywgeTogbisrIH0sXG4gICAgICB0aW1lU3RhbXA6IG4rKyxcbiAgICB9LFxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBuZXdQb2ludGVyIChuID0gNTApIHtcbiAgcmV0dXJuIHtcbiAgICBwb2ludGVySWQ6IG4rKyxcbiAgICBwYWdlWDogbisrLFxuICAgIHBhZ2VZOiBuKyssXG4gICAgY2xpZW50WDogbisrLFxuICAgIGNsaWVudFk6IG4rKyxcbiAgfSBhcyBJbnRlcmFjdC5Qb2ludGVyVHlwZVxufVxuXG5leHBvcnQgZnVuY3Rpb24gbW9ja1Njb3BlIChvcHRpb25zID0ge30gYXMgYW55KSB7XG4gIGNvbnN0IGRvY3VtZW50ID0gb3B0aW9ucy5kb2N1bWVudCB8fCBkb2NcbiAgY29uc3Qgd2luZG93ID0gZG9jdW1lbnQuZGVmYXVsdFZpZXdcblxuICBjb25zdCBzY29wZSA9IGNyZWF0ZVNjb3BlKCkuaW5pdCh3aW5kb3cpXG5cbiAgc2NvcGUuaW50ZXJhY3QgPSBPYmplY3QuYXNzaWduKCgpID0+IHt9LCB7IHVzZSAoKSB7fSB9KSBhcyBhbnlcblxuICByZXR1cm4gc2NvcGUgYXMgYW55XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtb2NrU2lnbmFscyAoKSB7XG4gIHJldHVybiB7XG4gICAgb24gKCkge30sXG4gICAgb2ZmICgpIHt9LFxuICAgIGZpcmUgKCkge30sXG4gIH0gYXMgdW5rbm93biBhcyBhbnlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1vY2tJbnRlcmFjdGFibGUgKHByb3BzID0ge30pIHtcbiAgcmV0dXJuIE9iamVjdC5hc3NpZ24oXG4gICAge1xuICAgICAgX3NpZ25hbHM6IG5ldyBTaWduYWxzKCksXG4gICAgICBfYWN0aW9uczoge1xuICAgICAgICBuYW1lczogW10sXG4gICAgICAgIG1ldGhvZERpY3Q6IHt9LFxuICAgICAgfSxcbiAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgZGVsdGFTb3VyY2U6ICdwYWdlJyxcbiAgICAgIH0sXG4gICAgICB0YXJnZXQ6IHt9LFxuICAgICAgZXZlbnRzOiBuZXcgRXZlbnRhYmxlKCksXG4gICAgICBnZXRSZWN0ICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudFxuICAgICAgICAgID8gdXRpbHMuZG9tLmdldEVsZW1lbnRDbGllbnRSZWN0KHRoaXMuZWxlbWVudClcbiAgICAgICAgICA6IHsgbGVmdDogMCwgdG9wOiAwLCByaWdodDogMCwgYm90dG9tOiAwIH1cbiAgICAgIH0sXG4gICAgICBmaXJlIChldmVudCkge1xuICAgICAgICB0aGlzLmV2ZW50cy5maXJlKGV2ZW50KVxuICAgICAgfSxcbiAgICB9LFxuICAgIHByb3BzKSBhcyBhbnlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFByb3BzIChzcmMsIHByb3BzKSB7XG4gIHJldHVybiBwcm9wcy5yZWR1Y2UoKGFjYywgcHJvcCkgPT4ge1xuICAgIGFjY1twcm9wXSA9IHNyY1twcm9wXVxuICAgIHJldHVybiBhY2NcbiAgfSwge30pXG59XG4iXX0=