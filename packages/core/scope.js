import * as utils from '@interactjs/utils';
import domObjects from '@interactjs/utils/domObjects';
import defaults from './defaultOptions';
import Eventable from './Eventable';
import InteractableBase from './Interactable';
import InteractEvent from './InteractEvent';
import interactions from './interactions';
const { win, browser, raf, Signals, events, } = utils;
export var ActionName;
(function (ActionName) {
})(ActionName || (ActionName = {}));
export function createScope() {
    return new Scope();
}
export class Scope {
    constructor() {
        // FIXME Signals
        this.signals = new Signals();
        this.browser = browser;
        this.events = events;
        this.utils = utils;
        this.defaults = utils.clone(defaults);
        this.Eventable = Eventable;
        this.actions = {
            names: [],
            methodDict: {},
            eventTypes: [],
        };
        this.InteractEvent = InteractEvent;
        this.interactables = new InteractableSet(this);
        // all documents being listened to
        this.documents = [];
        const scope = this;
        this.Interactable = class Interactable extends InteractableBase {
            get _defaults() { return scope.defaults; }
            set(options) {
                super.set(options);
                scope.interactables.signals.fire('set', {
                    options,
                    interactable: this,
                });
                return this;
            }
            unset() {
                super.unset();
                scope.interactables.signals.fire('unset', { interactable: this });
            }
        };
    }
    init(window) {
        return initScope(this, window);
    }
    addDocument(doc, options) {
        // do nothing if document is already known
        if (this.getDocIndex(doc) !== -1) {
            return false;
        }
        const window = win.getWindow(doc);
        options = options ? utils.extend({}, options) : {};
        this.documents.push({ doc, options });
        events.documents.push(doc);
        // don't add an unload event for the main document
        // so that the page may be cached in browser history
        if (doc !== this.document) {
            events.add(window, 'unload', this.onWindowUnload);
        }
        this.signals.fire('add-document', { doc, window, scope: this, options });
    }
    removeDocument(doc) {
        const index = this.getDocIndex(doc);
        const window = win.getWindow(doc);
        const options = this.documents[index].options;
        events.remove(window, 'unload', this.onWindowUnload);
        this.documents.splice(index, 1);
        events.documents.splice(index, 1);
        this.signals.fire('remove-document', { doc, window, scope: this, options });
    }
    onWindowUnload(event) {
        this.removeDocument(event.target);
    }
    getDocIndex(doc) {
        for (let i = 0; i < this.documents.length; i++) {
            if (this.documents[i].doc === doc) {
                return i;
            }
        }
        return -1;
    }
    getDocOptions(doc) {
        const docIndex = this.getDocIndex(doc);
        return docIndex === -1 ? null : this.documents[docIndex].options;
    }
}
export class InteractableSet {
    constructor(scope) {
        this.scope = scope;
        this.signals = new utils.Signals();
        // all set interactables
        this.list = [];
    }
    new(target, options) {
        options = utils.extend(options || {}, {
            actions: this.scope.actions,
        });
        const interactable = new this.scope.Interactable(target, options, this.scope.document);
        this.scope.addDocument(interactable._doc);
        this.list.push(interactable);
        this.signals.fire('new', {
            target,
            options,
            interactable,
            win: this.scope._win,
        });
        return interactable;
    }
    indexOfElement(target, context) {
        context = context || this.scope.document;
        const list = this.list;
        for (let i = 0; i < list.length; i++) {
            const interactable = list[i];
            if (interactable.target === target && interactable._context === context) {
                return i;
            }
        }
        return -1;
    }
    get(element, options, dontCheckInContext) {
        const ret = this.list[this.indexOfElement(element, options && options.context)];
        return ret && (utils.is.string(element) || dontCheckInContext || ret.inContext(element)) ? ret : null;
    }
    forEachMatch(element, callback) {
        for (const interactable of this.list) {
            let ret;
            if ((utils.is.string(interactable.target)
                // target is a selector and the element matches
                ? (utils.is.element(element) && utils.dom.matchesSelector(element, interactable.target))
                // target is the element
                : element === interactable.target) &&
                // the element is in context
                (interactable.inContext(element))) {
                ret = callback(interactable);
            }
            if (ret !== undefined) {
                return ret;
            }
        }
    }
}
export function initScope(scope, window) {
    win.init(window);
    domObjects.init(window);
    browser.init(window);
    raf.init(window);
    events.init(window);
    interactions.install(scope);
    scope.document = window.document;
    return scope;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NvcGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzY29wZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEtBQUssS0FBSyxNQUFNLG1CQUFtQixDQUFBO0FBQzFDLE9BQU8sVUFBVSxNQUFNLDhCQUE4QixDQUFBO0FBQ3JELE9BQU8sUUFBUSxNQUFNLGtCQUFrQixDQUFBO0FBQ3ZDLE9BQU8sU0FBUyxNQUFNLGFBQWEsQ0FBQTtBQUNuQyxPQUFPLGdCQUFnQixNQUFNLGdCQUFnQixDQUFBO0FBQzdDLE9BQU8sYUFBYSxNQUFNLGlCQUFpQixDQUFBO0FBQzNDLE9BQU8sWUFBWSxNQUFNLGdCQUFnQixDQUFBO0FBRXpDLE1BQU0sRUFDSixHQUFHLEVBQ0gsT0FBTyxFQUNQLEdBQUcsRUFDSCxPQUFPLEVBQ1AsTUFBTSxHQUNQLEdBQUcsS0FBSyxDQUFBO0FBRVQsTUFBTSxDQUFOLElBQVksVUFDWDtBQURELFdBQVksVUFBVTtBQUN0QixDQUFDLEVBRFcsVUFBVSxLQUFWLFVBQVUsUUFDckI7QUFRRCxNQUFNLFVBQVUsV0FBVztJQUN6QixPQUFPLElBQUksS0FBSyxFQUFFLENBQUE7QUFDcEIsQ0FBQztBQUlELE1BQU0sT0FBTyxLQUFLO0lBMkJoQjtRQTFCQSxnQkFBZ0I7UUFDaEIsWUFBTyxHQUFHLElBQUksT0FBTyxFQUFFLENBQUE7UUFDdkIsWUFBTyxHQUFHLE9BQU8sQ0FBQTtRQUNqQixXQUFNLEdBQUcsTUFBTSxDQUFBO1FBQ2YsVUFBSyxHQUFHLEtBQUssQ0FBQTtRQUNiLGFBQVEsR0FBYSxLQUFLLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBYSxDQUFBO1FBQ3RELGNBQVMsR0FBRyxTQUFTLENBQUE7UUFDckIsWUFBTyxHQUFZO1lBQ2pCLEtBQUssRUFBRSxFQUFFO1lBQ1QsVUFBVSxFQUFFLEVBQUU7WUFDZCxVQUFVLEVBQUUsRUFBRTtTQUNmLENBQUE7UUFFRCxrQkFBYSxHQUFHLGFBQWEsQ0FBQTtRQUU3QixrQkFB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QyxDQUFBO0lBQ3BCLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUE7SUFDaEIsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQTtJQUVuQixZQUFZLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFBO0lBQzNCLEtBQUssQ0FBQyxRQUFRLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQTtJQUVoQyxPQUFPLEtBQUssQ0FBQTtBQUNkLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyB1dGlscyBmcm9tICdAaW50ZXJhY3Rqcy91dGlscydcbmltcG9ydCBkb21PYmplY3RzIGZyb20gJ0BpbnRlcmFjdGpzL3V0aWxzL2RvbU9iamVjdHMnXG5pbXBvcnQgZGVmYXVsdHMgZnJvbSAnLi9kZWZhdWx0T3B0aW9ucydcbmltcG9ydCBFdmVudGFibGUgZnJvbSAnLi9FdmVudGFibGUnXG5pbXBvcnQgSW50ZXJhY3RhYmxlQmFzZSBmcm9tICcuL0ludGVyYWN0YWJsZSdcbmltcG9ydCBJbnRlcmFjdEV2ZW50IGZyb20gJy4vSW50ZXJhY3RFdmVudCdcbmltcG9ydCBpbnRlcmFjdGlvbnMgZnJvbSAnLi9pbnRlcmFjdGlvbnMnXG5cbmNvbnN0IHtcbiAgd2luLFxuICBicm93c2VyLFxuICByYWYsXG4gIFNpZ25hbHMsXG4gIGV2ZW50cyxcbn0gPSB1dGlsc1xuXG5leHBvcnQgZW51bSBBY3Rpb25OYW1lIHtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBBY3Rpb25zIHtcbiAgbmFtZXM6IEFjdGlvbk5hbWVbXVxuICBtZXRob2REaWN0OiB7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9XG4gIGV2ZW50VHlwZXM6IHN0cmluZ1tdXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVTY29wZSAoKSB7XG4gIHJldHVybiBuZXcgU2NvcGUoKVxufVxuXG5leHBvcnQgdHlwZSBEZWZhdWx0cyA9IHR5cGVvZiBkZWZhdWx0c1xuXG5leHBvcnQgY2xhc3MgU2NvcGUge1xuICAvLyBGSVhNRSBTaWduYWxzXG4gIHNpZ25hbHMgPSBuZXcgU2lnbmFscygpXG4gIGJyb3dzZXIgPSBicm93c2VyXG4gIGV2ZW50cyA9IGV2ZW50c1xuICB1dGlscyA9IHV0aWxzXG4gIGRlZmF1bHRzOiBEZWZhdWx0cyA9IHV0aWxzLmNsb25lKGRlZmF1bHRzKSBhcyBEZWZhdWx0c1xuICBFdmVudGFibGUgPSBFdmVudGFibGVcbiAgYWN0aW9uczogQWN0aW9ucyA9IHtcbiAgICBuYW1lczogW10sXG4gICAgbWV0aG9kRGljdDoge30sXG4gICAgZXZlbnRUeXBlczogW10sXG4gIH1cblxuICBJbnRlcmFjdEV2ZW50ID0gSW50ZXJhY3RFdmVudFxuICBJbnRlcmFjdGFibGUhOiB0eXBlb2YgSW50ZXJhY3RhYmxlQmFzZVxuICBpbnRlcmFjdGFibGVzID0gbmV3IEludGVyYWN0YWJsZVNldCh0aGlzKVxuXG4gIC8vIG1haW4gd2luZG93XG4gIF93aW4hOiBXaW5kb3dcblxuICAvLyBtYWluIGRvY3VtZW50XG4gIGRvY3VtZW50ITogRG9jdW1lbnRcblxuICAvLyBhbGwgZG9jdW1lbnRzIGJlaW5nIGxpc3RlbmVkIHRvXG4gIGRvY3VtZW50czogQXJyYXk8eyBkb2M6IERvY3VtZW50LCBvcHRpb25zOiBhbnkgfT4gPSBbXVxuXG4gIGNvbnN0cnVjdG9yICgpIHtcbiAgICBjb25zdCBzY29wZSA9IHRoaXMgYXMgU2NvcGU7XG5cbiAgICAodGhpcyBhcyB7IEludGVyYWN0YWJsZTogdHlwZW9mIEludGVyYWN0YWJsZUJhc2UgfSkuSW50ZXJhY3RhYmxlID0gY2xhc3MgSW50ZXJhY3RhYmxlIGV4dGVuZHMgSW50ZXJhY3RhYmxlQmFzZSBpbXBsZW1lbnRzIEludGVyYWN0YWJsZUJhc2Uge1xuICAgICAgZ2V0IF9kZWZhdWx0cyAoKSB7IHJldHVybiBzY29wZS5kZWZhdWx0cyB9XG5cbiAgICAgIHNldCAob3B0aW9uczogYW55KSB7XG4gICAgICAgIHN1cGVyLnNldChvcHRpb25zKVxuXG4gICAgICAgIHNjb3BlLmludGVyYWN0YWJsZXMuc2lnbmFscy5maXJlKCdzZXQnLCB7XG4gICAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgICBpbnRlcmFjdGFibGU6IHRoaXMsXG4gICAgICAgIH0pXG5cbiAgICAgICAgcmV0dXJuIHRoaXNcbiAgICAgIH1cblxuICAgICAgdW5zZXQgKCkge1xuICAgICAgICBzdXBlci51bnNldCgpXG4gICAgICAgIHNjb3BlLmludGVyYWN0YWJsZXMuc2lnbmFscy5maXJlKCd1bnNldCcsIHsgaW50ZXJhY3RhYmxlOiB0aGlzIH0pXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaW5pdCAod2luZG93OiBXaW5kb3cpIHtcbiAgICByZXR1cm4gaW5pdFNjb3BlKHRoaXMsIHdpbmRvdylcbiAgfVxuXG4gIGFkZERvY3VtZW50IChkb2M6IERvY3VtZW50LCBvcHRpb25zPzogYW55KTogdm9pZCB8IGZhbHNlIHtcbiAgICAvLyBkbyBub3RoaW5nIGlmIGRvY3VtZW50IGlzIGFscmVhZHkga25vd25cbiAgICBpZiAodGhpcy5nZXREb2NJbmRleChkb2MpICE9PSAtMSkgeyByZXR1cm4gZmFsc2UgfVxuXG4gICAgY29uc3Qgd2luZG93ID0gd2luLmdldFdpbmRvdyhkb2MpXG5cbiAgICBvcHRpb25zID0gb3B0aW9ucyA/IHV0aWxzLmV4dGVuZCh7fSwgb3B0aW9ucykgOiB7fVxuXG4gICAgdGhpcy5kb2N1bWVudHMucHVzaCh7IGRvYywgb3B0aW9ucyB9KVxuICAgIGV2ZW50cy5kb2N1bWVudHMucHVzaChkb2MpXG5cbiAgICAvLyBkb24ndCBhZGQgYW4gdW5sb2FkIGV2ZW50IGZvciB0aGUgbWFpbiBkb2N1bWVudFxuICAgIC8vIHNvIHRoYXQgdGhlIHBhZ2UgbWF5IGJlIGNhY2hlZCBpbiBicm93c2VyIGhpc3RvcnlcbiAgICBpZiAoZG9jICE9PSB0aGlzLmRvY3VtZW50KSB7XG4gICAgICBldmVudHMuYWRkKHdpbmRvdywgJ3VubG9hZCcsIHRoaXMub25XaW5kb3dVbmxvYWQpXG4gICAgfVxuXG4gICAgdGhpcy5zaWduYWxzLmZpcmUoJ2FkZC1kb2N1bWVudCcsIHsgZG9jLCB3aW5kb3csIHNjb3BlOiB0aGlzLCBvcHRpb25zIH0pXG4gIH1cblxuICByZW1vdmVEb2N1bWVudCAoZG9jOiBEb2N1bWVudCkge1xuICAgIGNvbnN0IGluZGV4ID0gdGhpcy5nZXREb2NJbmRleChkb2MpXG5cbiAgICBjb25zdCB3aW5kb3cgPSB3aW4uZ2V0V2luZG93KGRvYylcbiAgICBjb25zdCBvcHRpb25zID0gdGhpcy5kb2N1bWVudHNbaW5kZXhdLm9wdGlvbnNcblxuICAgIGV2ZW50cy5yZW1vdmUod2luZG93LCAndW5sb2FkJywgdGhpcy5vbldpbmRvd1VubG9hZClcblxuICAgIHRoaXMuZG9jdW1lbnRzLnNwbGljZShpbmRleCwgMSlcbiAgICBldmVudHMuZG9jdW1lbnRzLnNwbGljZShpbmRleCwgMSlcblxuICAgIHRoaXMuc2lnbmFscy5maXJlKCdyZW1vdmUtZG9jdW1lbnQnLCB7IGRvYywgd2luZG93LCBzY29wZTogdGhpcywgb3B0aW9ucyB9KVxuICB9XG5cbiAgb25XaW5kb3dVbmxvYWQgKGV2ZW50OiBFdmVudCkge1xuICAgIHRoaXMucmVtb3ZlRG9jdW1lbnQoZXZlbnQudGFyZ2V0IGFzIERvY3VtZW50KVxuICB9XG5cbiAgZ2V0RG9jSW5kZXggKGRvYzogRG9jdW1lbnQpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuZG9jdW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAodGhpcy5kb2N1bWVudHNbaV0uZG9jID09PSBkb2MpIHtcbiAgICAgICAgcmV0dXJuIGlcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gLTFcbiAgfVxuXG4gIGdldERvY09wdGlvbnMgKGRvYzogRG9jdW1lbnQpIHtcbiAgICBjb25zdCBkb2NJbmRleCA9IHRoaXMuZ2V0RG9jSW5kZXgoZG9jKVxuXG4gICAgcmV0dXJuIGRvY0luZGV4ID09PSAtMSA/IG51bGwgOiB0aGlzLmRvY3VtZW50c1tkb2NJbmRleF0ub3B0aW9uc1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBJbnRlcmFjdGFibGVTZXQge1xuICBzaWduYWxzID0gbmV3IHV0aWxzLlNpZ25hbHMoKVxuXG4gIC8vIGFsbCBzZXQgaW50ZXJhY3RhYmxlc1xuICBsaXN0OiBJbnRlcmFjdGFibGVCYXNlW10gPSBbXVxuXG4gIGNvbnN0cnVjdG9yIChwcm90ZWN0ZWQgc2NvcGU6IFNjb3BlKSB7fVxuXG4gIG5ldyAodGFyZ2V0OiBJbnRlcmFjdC5UYXJnZXQsIG9wdGlvbnM/OiBhbnkpOiBJbnRlcmFjdGFibGVCYXNlIHtcbiAgICBvcHRpb25zID0gdXRpbHMuZXh0ZW5kKG9wdGlvbnMgfHwge30sIHtcbiAgICAgIGFjdGlvbnM6IHRoaXMuc2NvcGUuYWN0aW9ucyxcbiAgICB9KVxuICAgIGNvbnN0IGludGVyYWN0YWJsZSA9IG5ldyB0aGlzLnNjb3BlLkludGVyYWN0YWJsZSh0YXJnZXQsIG9wdGlvbnMsIHRoaXMuc2NvcGUuZG9jdW1lbnQpXG5cbiAgICB0aGlzLnNjb3BlLmFkZERvY3VtZW50KGludGVyYWN0YWJsZS5fZG9jKVxuICAgIHRoaXMubGlzdC5wdXNoKGludGVyYWN0YWJsZSlcblxuICAgIHRoaXMuc2lnbmFscy5maXJlKCduZXcnLCB7XG4gICAgICB0YXJnZXQsXG4gICAgICBvcHRpb25zLFxuICAgICAgaW50ZXJhY3RhYmxlLFxuICAgICAgd2luOiB0aGlzLnNjb3BlLl93aW4sXG4gICAgfSlcblxuICAgIHJldHVybiBpbnRlcmFjdGFibGVcbiAgfVxuXG4gIGluZGV4T2ZFbGVtZW50ICh0YXJnZXQ6IEludGVyYWN0LlRhcmdldCwgY29udGV4dDogRG9jdW1lbnQgfCBFbGVtZW50KSB7XG4gICAgY29udGV4dCA9IGNvbnRleHQgfHwgdGhpcy5zY29wZS5kb2N1bWVudFxuXG4gICAgY29uc3QgbGlzdCA9IHRoaXMubGlzdFxuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBpbnRlcmFjdGFibGUgPSBsaXN0W2ldXG5cbiAgICAgIGlmIChpbnRlcmFjdGFibGUudGFyZ2V0ID09PSB0YXJnZXQgJiYgaW50ZXJhY3RhYmxlLl9jb250ZXh0ID09PSBjb250ZXh0KSB7XG4gICAgICAgIHJldHVybiBpXG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIC0xXG4gIH1cblxuICBnZXQgKGVsZW1lbnQ6IEludGVyYWN0LlRhcmdldCwgb3B0aW9ucywgZG9udENoZWNrSW5Db250ZXh0PzogYm9vbGVhbikge1xuICAgIGNvbnN0IHJldCA9IHRoaXMubGlzdFt0aGlzLmluZGV4T2ZFbGVtZW50KGVsZW1lbnQsIG9wdGlvbnMgJiYgb3B0aW9ucy5jb250ZXh0KV1cblxuICAgIHJldHVybiByZXQgJiYgKHV0aWxzLmlzLnN0cmluZyhlbGVtZW50KSB8fCBkb250Q2hlY2tJbkNvbnRleHQgfHwgcmV0LmluQ29udGV4dChlbGVtZW50KSkgPyByZXQgOiBudWxsXG4gIH1cblxuICBmb3JFYWNoTWF0Y2ggKGVsZW1lbnQ6IERvY3VtZW50IHwgRWxlbWVudCwgY2FsbGJhY2s6IChpbnRlcmFjdGFibGU6IGFueSkgPT4gYW55KSB7XG4gICAgZm9yIChjb25zdCBpbnRlcmFjdGFibGUgb2YgdGhpcy5saXN0KSB7XG4gICAgICBsZXQgcmV0XG5cbiAgICAgIGlmICgodXRpbHMuaXMuc3RyaW5nKGludGVyYWN0YWJsZS50YXJnZXQpXG4gICAgICAvLyB0YXJnZXQgaXMgYSBzZWxlY3RvciBhbmQgdGhlIGVsZW1lbnQgbWF0Y2hlc1xuICAgICAgICA/ICh1dGlscy5pcy5lbGVtZW50KGVsZW1lbnQpICYmIHV0aWxzLmRvbS5tYXRjaGVzU2VsZWN0b3IoZWxlbWVudCwgaW50ZXJhY3RhYmxlLnRhcmdldCkpXG4gICAgICAgIC8vIHRhcmdldCBpcyB0aGUgZWxlbWVudFxuICAgICAgICA6IGVsZW1lbnQgPT09IGludGVyYWN0YWJsZS50YXJnZXQpICYmXG4gICAgICAgIC8vIHRoZSBlbGVtZW50IGlzIGluIGNvbnRleHRcbiAgICAgICAgKGludGVyYWN0YWJsZS5pbkNvbnRleHQoZWxlbWVudCkpKSB7XG4gICAgICAgIHJldCA9IGNhbGxiYWNrKGludGVyYWN0YWJsZSlcbiAgICAgIH1cblxuICAgICAgaWYgKHJldCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiByZXRcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGluaXRTY29wZSAoc2NvcGU6IFNjb3BlLCB3aW5kb3c6IFdpbmRvdykge1xuICB3aW4uaW5pdCh3aW5kb3cpXG4gIGRvbU9iamVjdHMuaW5pdCh3aW5kb3cpXG4gIGJyb3dzZXIuaW5pdCh3aW5kb3cpXG4gIHJhZi5pbml0KHdpbmRvdylcbiAgZXZlbnRzLmluaXQod2luZG93KVxuXG4gIGludGVyYWN0aW9ucy5pbnN0YWxsKHNjb3BlKVxuICBzY29wZS5kb2N1bWVudCA9IHdpbmRvdy5kb2N1bWVudFxuXG4gIHJldHVybiBzY29wZVxufVxuIl19