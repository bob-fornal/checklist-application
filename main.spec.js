
describe('Testing Checklist', () => {

  describe('"state" object', () => {
    it('expect constant initialization', () => {
      expect(state.debug).toEqual(false);
      expect(state.displayMode).toEqual('');
      expect(state.colors).toEqual({});
      
      expect(state.colorDefault).toEqual({
        backgroundColor: '#ffffff',
        foregroundColor: '#000000',
        altBackgroundColor: '#fafad2'
      });
      expect(state.colorCustomStart).toEqual({
        backgroundColor: '#111111',
        foregroundColor: '#eeeeee',
        altBackgroundColor: '#2f4f4f'
      });
    });

    it('expect functions', () => {
      expect(state.init).toEqual(jasmine.any(Function));
      expect(state.calculateLogoColor).toEqual(jasmine.any(Function));
      expect(state.calculateIndividualColorAdjust).toEqual(jasmine.any(Function));
      expect(state.calculateBrightness).toEqual(jasmine.any(Function));
      expect(state.hexToRGB).toEqual(jasmine.any(Function));
      expect(state.componentToHex).toEqual(jasmine.any(Function));
      expect(state.rgbToHex).toEqual(jasmine.any(Function));
    });

    it('expects "rgbToHex" to return hex values', () => {
      expect(state.rgbToHex({ r: 0, g: 0, b: 0 })).toEqual("#000000");
      expect(state.rgbToHex({ r: 255, g: 255, b: 255 })).toEqual("#ffffff");
    });
    it('expects "componentToHex" to return a two character hex value', () => {
      expect(state.componentToHex(0)).toEqual("00");
      expect(state.componentToHex(255)).toEqual("ff");
    });
  });

});