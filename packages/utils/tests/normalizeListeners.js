import test from '@interactjs/_dev/test/test';
import normalizeListeners from '../normalizeListeners';
test('utils/normalizeListeners', (t) => {
    const a = () => { };
    const b = () => { };
    const c = () => { };
    t.deepEqual(normalizeListeners('type1', a), {
        type1: [a],
    }, 'single type, single listener function');
    t.deepEqual(normalizeListeners('type1 type2', a), {
        type1: [a],
        type2: [a],
    }, 'multiple types, single listener function');
    t.deepEqual(normalizeListeners('type1 type2', a), normalizeListeners(['type1', 'type2'], a), 'array of types equivalent to space separated string');
    t.deepEqual(normalizeListeners('type1', [a, b]), {
        type1: [a, b],
    }, 'single type, multiple listener functions');
    t.deepEqual(normalizeListeners('prefix', { _1: [a, b], _2: [b, c] }), {
        prefix_1: [a, b],
        prefix_2: [b, c],
    }, 'single type prefix, object of { suffix: [fn, ...] }');
    t.deepEqual(normalizeListeners('prefix1 prefix2', [{ _1: [a, b], _2: [b, c] }]), {
        prefix1_1: [a, b],
        prefix1_2: [b, c],
        prefix2_1: [a, b],
        prefix2_2: [b, c],
    }, 'multiple type prefixes, single length array of { suffix: [fn, ...] }');
    t.deepEqual(normalizeListeners({ _1: [a, b], _2: [b, c] }), {
        _1: [a, b],
        _2: [b, c],
    }, 'object of { suffix: [fn, ...] } as type arg');
    t.deepEqual(normalizeListeners({ '_1 _2': [a, b], '_3': [b, c] }), {
        _1: [a, b],
        _2: [a, b],
        _3: [b, c],
    }, 'object of { "suffix1 suffix2": [fn, ...], ... } as type arg');
    t.deepEqual(normalizeListeners('prefix', { '_1 _2': [a, b], '_3': [b, c] }), {
        prefix_1: [a, b],
        prefix_2: [a, b],
        prefix_3: [b, c],
    }, 'single type prefix, object of { "suffix1 suffix2": [fn, ...], ... }');
    t.end();
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9ybWFsaXplTGlzdGVuZXJzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibm9ybWFsaXplTGlzdGVuZXJzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sSUFBSSxNQUFNLDRCQUE0QixDQUFBO0FBQzdDLE9BQU8sa0JBQWtCLE1BQU0sdUJBQXVCLENBQUE7QUFFdEQsSUFBSSxDQUFDLDBCQUEwQixFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUU7SUFDckMsTUFBTSxDQUFDLEdBQUcsR0FBRyxFQUFFLEdBQUUsQ0FBQyxDQUFBO0lBQ2xCLE1BQU0sQ0FBQyxHQUFHLEdBQUcsRUFBRSxHQUFFLENBQUMsQ0FBQTtJQUNsQixNQUFNLENBQUMsR0FBRyxHQUFHLEVBQUUsR0FBRSxDQUFDLENBQUE7SUFFbEIsQ0FBQyxDQUFDLFNBQVMsQ0FDVCxrQkFBa0IsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLEVBQzlCO1FBQ0UsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO0tBQ1gsRUFDRCx1Q0FBdUMsQ0FBQyxDQUFBO0lBRTFDLENBQUMsQ0FBQyxTQUFTLENBQ1Qsa0JBQWtCLENBQUMsYUFBYSxFQUFFLENBQUMsQ0FBQyxFQUNwQztRQUNFLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNWLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztLQUNYLEVBQ0QsMENBQTBDLENBQUMsQ0FBQTtJQUU3QyxDQUFDLENBQUMsU0FBUyxDQUNULGtCQUFrQixDQUFDLGFBQWEsRUFBRSxDQUFDLENBQUMsRUFDcEMsa0JBQWtCLENBQUMsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQ3pDLHFEQUFxRCxDQUFDLENBQUE7SUFFeEQsQ0FBQyxDQUFDLFNBQVMsQ0FDVCxrQkFBa0IsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFDbkM7UUFDRSxLQUFLLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0tBQ2QsRUFDRCwwQ0FBMEMsQ0FBQyxDQUFBO0lBRTdDLENBQUMsQ0FBQyxTQUFTLENBQ1Qsa0JBQWtCLENBQUMsUUFBUSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQ3hEO1FBQ0UsUUFBUSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNoQixRQUFRLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0tBQ2pCLEVBQ0QscURBQXFELENBQUMsQ0FBQTtJQUV4RCxDQUFDLENBQUMsU0FBUyxDQUNULGtCQUFrQixDQUFDLGlCQUFpQixFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUNuRTtRQUNFLFNBQVMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDakIsU0FBUyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNqQixTQUFTLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ2pCLFNBQVMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7S0FDbEIsRUFDRCxzRUFBc0UsQ0FBQyxDQUFBO0lBRXpFLENBQUMsQ0FBQyxTQUFTLENBQ1Qsa0JBQWtCLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFDOUM7UUFDRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ1YsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztLQUNYLEVBQ0QsNkNBQTZDLENBQUMsQ0FBQTtJQUVoRCxDQUFDLENBQUMsU0FBUyxDQUNULGtCQUFrQixDQUFDLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQ3JEO1FBQ0UsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNWLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDVixFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0tBQ1gsRUFDRCw2REFBNkQsQ0FBQyxDQUFBO0lBRWhFLENBQUMsQ0FBQyxTQUFTLENBQ1Qsa0JBQWtCLENBQUMsUUFBUSxFQUFFLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQy9EO1FBQ0UsUUFBUSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNoQixRQUFRLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ2hCLFFBQVEsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7S0FDakIsRUFDRCxxRUFBcUUsQ0FBQyxDQUFBO0lBRXhFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQTtBQUNULENBQUMsQ0FBQyxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHRlc3QgZnJvbSAnQGludGVyYWN0anMvX2Rldi90ZXN0L3Rlc3QnXG5pbXBvcnQgbm9ybWFsaXplTGlzdGVuZXJzIGZyb20gJy4uL25vcm1hbGl6ZUxpc3RlbmVycydcblxudGVzdCgndXRpbHMvbm9ybWFsaXplTGlzdGVuZXJzJywgKHQpID0+IHtcbiAgY29uc3QgYSA9ICgpID0+IHt9XG4gIGNvbnN0IGIgPSAoKSA9PiB7fVxuICBjb25zdCBjID0gKCkgPT4ge31cblxuICB0LmRlZXBFcXVhbChcbiAgICBub3JtYWxpemVMaXN0ZW5lcnMoJ3R5cGUxJywgYSksXG4gICAge1xuICAgICAgdHlwZTE6IFthXSxcbiAgICB9LFxuICAgICdzaW5nbGUgdHlwZSwgc2luZ2xlIGxpc3RlbmVyIGZ1bmN0aW9uJylcblxuICB0LmRlZXBFcXVhbChcbiAgICBub3JtYWxpemVMaXN0ZW5lcnMoJ3R5cGUxIHR5cGUyJywgYSksXG4gICAge1xuICAgICAgdHlwZTE6IFthXSxcbiAgICAgIHR5cGUyOiBbYV0sXG4gICAgfSxcbiAgICAnbXVsdGlwbGUgdHlwZXMsIHNpbmdsZSBsaXN0ZW5lciBmdW5jdGlvbicpXG5cbiAgdC5kZWVwRXF1YWwoXG4gICAgbm9ybWFsaXplTGlzdGVuZXJzKCd0eXBlMSB0eXBlMicsIGEpLFxuICAgIG5vcm1hbGl6ZUxpc3RlbmVycyhbJ3R5cGUxJywgJ3R5cGUyJ10sIGEpLFxuICAgICdhcnJheSBvZiB0eXBlcyBlcXVpdmFsZW50IHRvIHNwYWNlIHNlcGFyYXRlZCBzdHJpbmcnKVxuXG4gIHQuZGVlcEVxdWFsKFxuICAgIG5vcm1hbGl6ZUxpc3RlbmVycygndHlwZTEnLCBbYSwgYl0pLFxuICAgIHtcbiAgICAgIHR5cGUxOiBbYSwgYl0sXG4gICAgfSxcbiAgICAnc2luZ2xlIHR5cGUsIG11bHRpcGxlIGxpc3RlbmVyIGZ1bmN0aW9ucycpXG5cbiAgdC5kZWVwRXF1YWwoXG4gICAgbm9ybWFsaXplTGlzdGVuZXJzKCdwcmVmaXgnLCB7IF8xOiBbYSwgYl0sIF8yOiBbYiwgY10gfSksXG4gICAge1xuICAgICAgcHJlZml4XzE6IFthLCBiXSxcbiAgICAgIHByZWZpeF8yOiBbYiwgY10sXG4gICAgfSxcbiAgICAnc2luZ2xlIHR5cGUgcHJlZml4LCBvYmplY3Qgb2YgeyBzdWZmaXg6IFtmbiwgLi4uXSB9JylcblxuICB0LmRlZXBFcXVhbChcbiAgICBub3JtYWxpemVMaXN0ZW5lcnMoJ3ByZWZpeDEgcHJlZml4MicsIFt7IF8xOiBbYSwgYl0sIF8yOiBbYiwgY10gfV0pLFxuICAgIHtcbiAgICAgIHByZWZpeDFfMTogW2EsIGJdLFxuICAgICAgcHJlZml4MV8yOiBbYiwgY10sXG4gICAgICBwcmVmaXgyXzE6IFthLCBiXSxcbiAgICAgIHByZWZpeDJfMjogW2IsIGNdLFxuICAgIH0sXG4gICAgJ211bHRpcGxlIHR5cGUgcHJlZml4ZXMsIHNpbmdsZSBsZW5ndGggYXJyYXkgb2YgeyBzdWZmaXg6IFtmbiwgLi4uXSB9JylcblxuICB0LmRlZXBFcXVhbChcbiAgICBub3JtYWxpemVMaXN0ZW5lcnMoeyBfMTogW2EsIGJdLCBfMjogW2IsIGNdIH0pLFxuICAgIHtcbiAgICAgIF8xOiBbYSwgYl0sXG4gICAgICBfMjogW2IsIGNdLFxuICAgIH0sXG4gICAgJ29iamVjdCBvZiB7IHN1ZmZpeDogW2ZuLCAuLi5dIH0gYXMgdHlwZSBhcmcnKVxuXG4gIHQuZGVlcEVxdWFsKFxuICAgIG5vcm1hbGl6ZUxpc3RlbmVycyh7ICdfMSBfMic6IFthLCBiXSwgJ18zJzogW2IsIGNdIH0pLFxuICAgIHtcbiAgICAgIF8xOiBbYSwgYl0sXG4gICAgICBfMjogW2EsIGJdLFxuICAgICAgXzM6IFtiLCBjXSxcbiAgICB9LFxuICAgICdvYmplY3Qgb2YgeyBcInN1ZmZpeDEgc3VmZml4MlwiOiBbZm4sIC4uLl0sIC4uLiB9IGFzIHR5cGUgYXJnJylcblxuICB0LmRlZXBFcXVhbChcbiAgICBub3JtYWxpemVMaXN0ZW5lcnMoJ3ByZWZpeCcsIHsgJ18xIF8yJzogW2EsIGJdLCAnXzMnOiBbYiwgY10gfSksXG4gICAge1xuICAgICAgcHJlZml4XzE6IFthLCBiXSxcbiAgICAgIHByZWZpeF8yOiBbYSwgYl0sXG4gICAgICBwcmVmaXhfMzogW2IsIGNdLFxuICAgIH0sXG4gICAgJ3NpbmdsZSB0eXBlIHByZWZpeCwgb2JqZWN0IG9mIHsgXCJzdWZmaXgxIHN1ZmZpeDJcIjogW2ZuLCAuLi5dLCAuLi4gfScpXG5cbiAgdC5lbmQoKVxufSlcbiJdfQ==