function *sample() {

}

Object.prototype.toString.apply(sample);
// -> "[object GeneratorFunction]"

Object.prototype.toString.apply(sample());
// -> "[object Generator]"
