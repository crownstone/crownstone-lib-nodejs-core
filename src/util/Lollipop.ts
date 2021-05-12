

export const Lollipop = {

  isHigher: function(value : number, thanValue: number, lollipopStem: number, lollipopMax: number) : boolean {
    let circleRange = lollipopMax - lollipopStem;
    let half = 0.5*circleRange;

    if (value === thanValue) { return false; }

    // if either are below the circle, normal check
    if (value < lollipopStem && value < thanValue) {
      return false;
    }

    if (thanValue < lollipopStem && thanValue < value ) {
      return true;
    }


    if (value < thanValue) {
      let upside = (thanValue + half);
      if (upside > lollipopMax) {
        upside = upside % lollipopMax + lollipopStem;
        if (upside > value) {
          return true;
        }
        return false;
      }
      return false;
    }
    else { // value > thanValue
      // the value is higher, check if the against value has overflown.
      return !Lollipop.isHigher(thanValue, value, lollipopStem, lollipopMax)
    }
  },



  increase: function(value : number, lollipopStem: number, lollipopMax: number) {
    let nextValue = value + 1;
    if (nextValue > lollipopMax) {
      nextValue = lollipopStem;
    }
    return nextValue
  }
}

export const LollipopUint16 = {
  isHigher: function(value : number, thanValue: number, lollipopStem: number) : boolean {
    return Lollipop.isHigher(value, thanValue, lollipopStem, (1<<16)-1);
  },

  increase: function(value : number, lollipopStem: number) {
    return Lollipop.increase(value, lollipopStem, (1<<16)-1);
  }
}