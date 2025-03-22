class GetPcmProcessor extends AudioWorkletProcessor {
  process(
    inputs: Float32Array[][],
    // outputs: Float32Array[][],
    // parameters: { [key: string]: Float32Array },
  ) {
    // console.log(inputs.length, inputs[0].length, inputs[0][0].length);
    const data = inputs[0][0];
    this.port.postMessage(data);
    return true;
  }
}

console.log(sampleRate);

registerProcessor('get-pcm-processor', GetPcmProcessor);
