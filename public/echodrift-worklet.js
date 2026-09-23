// AudioWorklet processor — loads echodrift WASM (built by web/dsp/build.sh)
// and runs the DSP in the audio render thread.

importScripts('/echodrift.js');

const BLOCK = 128;

let mod        = null;
let dspPtr     = null;
let inBufL     = 0, inBufR  = 0;
let outBufL    = 0, outBufR = 0;
let wasmReady  = false;
let pendingParams = [];

EchodriftModule().then((m) => {
    mod    = m;
    dspPtr = m._echodrift_create(sampleRate);

    // Allocate I/O float buffers on the WASM heap
    inBufL  = m._malloc(BLOCK * 4);
    inBufR  = m._malloc(BLOCK * 4);
    outBufL = m._malloc(BLOCK * 4);
    outBufR = m._malloc(BLOCK * 4);

    // Apply any params that arrived before WASM was ready
    for (const { id, value } of pendingParams)
        m._echodrift_set_param(dspPtr, id, value);
    pendingParams = [];

    wasmReady = true;
});

class EchodriftProcessor extends AudioWorkletProcessor {
    constructor () {
        super();
        this.port.onmessage = (e) => {
            const { type, id, value } = e.data;
            if (type === 'setParam') {
                if (wasmReady) {
                    mod._echodrift_set_param(dspPtr, id, value);
                } else {
                    pendingParams.push({ id, value });
                }
            }
        };
    }

    process (inputs, outputs) {
        const inputL  = inputs[0]?.[0];
        const inputR  = inputs[0]?.[1] ?? inputL;
        const outputL = outputs[0][0];
        const outputR = outputs[0][1] ?? outputs[0][0];

        if (!wasmReady || !inputL) {
            // Pass silence until ready
            outputL.fill(0);
            if (outputR !== outputL) outputR.fill(0);
            return true;
        }

        // Copy JS Float32Arrays into WASM heap
        mod.HEAPF32.set(inputL, inBufL  >> 2);
        mod.HEAPF32.set(inputR, inBufR  >> 2);

        mod._echodrift_process(dspPtr, inBufL, inBufR, outBufL, outBufR, BLOCK);

        // Copy results back out
        outputL.set(mod.HEAPF32.subarray(outBufL >> 2, (outBufL >> 2) + BLOCK));
        if (outputR !== outputL)
            outputR.set(mod.HEAPF32.subarray(outBufR >> 2, (outBufR >> 2) + BLOCK));

        return true;
    }
}

registerProcessor('echodrift-processor', EchodriftProcessor);
