const toTheDarkSide = () => {

    const perceivedBrightness = (r,g,b) => {
        r /= 255;
        g /= 255;
        b /= 255;
        return Math.sqrt(  .299 * r ** 2 + .587 * g ** 2 + .114 * b ** 2 );
    }



    /**
     * rgbToHsl function from:
     * https://css-tricks.com/converting-color-spaces-in-javascript/#aa-rgb-to-hsl
     * 
     * Authored by: Jon Kantner
     */
    const rgbaToHsla = (r,g,b,a) => {
        // Make r, g, and b fractions of 1
        r /= 255;
        g /= 255;
        b /= 255;
    
        // Find greatest and smallest channel values
        let cmin = Math.min(r,g,b),
            cmax = Math.max(r,g,b),
            delta = cmax - cmin,
            h = 0,
            s = 0,
            l = 0;

        // Calculate hue
        // No difference
        if (delta == 0)
            h = 0;
        // Red is max
        else if (cmax == r)
            h = ((g - b) / delta) % 6;
        // Green is max
        else if (cmax == g)
            h = (b - r) / delta + 2;
        // Blue is max
        else
            h = (r - g) / delta + 4;

        h = Math.round(h * 60);
        
        // Make negative hues positive behind 360°
        if (h < 0)
            h += 360;

        // Calculate lightness
        l = (cmax + cmin) / 2;

        // Calculate saturation
        s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

        // return "hsl(" + h + "," + s + "%," + l + "%)";
        return [h, s, l, +a];
    }



    const getDarkModeHsla = (hsla, perceivedBrightness) => {
        let [hue, saturation, lightness, alpha] = hsla;

        // If perceived brightness is low, bump the centerpoint up.
        // It will make low brightness perceived colors become even
        // brighter when "inverted".
        // The opposite of it should be done for brightly perceived colors.
        const ratio = Math.log10((perceivedBrightness / 0.5));
        const adjustedMiddlePoint = 0.5 / (1 + ratio * 0.5);
        
        // Calculate the distance from the middle point of lightness
        // and invert it, making dark colors lighter and vice versa
        const diffFromAdjustedHalf = perceivedBrightness - adjustedMiddlePoint;
        lightness = adjustedMiddlePoint - diffFromAdjustedHalf;

        // Set lower and upper lightness limits
        if (lightness < 0.125) lightness = 0.125;
        if (lightness > 1) lightness = 0.95;

        // make saturation go down with lower lightness levels
        saturation = lightness > 0.125 && lightness * 0.4 + 0.4;

        const h = hue;
        const s = +(saturation * 100).toFixed(1);
        const l = +(lightness * 100).toFixed(1);
        const a = alpha;

        return "hsla(" + h + "," + s + "%," + l + "%," + a + ")";
    }



    const convertElementToDarkMode = (element) => {
        const computedStyle = getComputedStyle(element);
        const parentComputedStyle = getComputedStyle(element.parentElement);

        let usesBorderShorthand = undefined;

        for (const property in computedStyle) {
            // avoid inversion of inherited values
            if (
                element.parentElement?.hasGottenDarkModeTreatment &&
                parentComputedStyle[property] === computedStyle[property]
            ) {
                continue;
            }

            // ignore some properties
            if (
                /block|inline|webkit/i.test(property) ||
                /none/.test(computedStyle[property])
            ) {
                continue;
            }

            // handle border bug
            if (
                property === 'border' &&
                computedStyle[property] !== 'none'
            ) {
                usesBorderShorthand = true;
            }
            if (
                /border(?=.)/.test(property) &&
                usesBorderShorthand
            ) {
                continue;
            }

            if (
                computedStyle[property] === 'rgba(0, 0, 0, 0)' &&
                property !== 'backgroundColor' &&
                element.tagName !== 'BODY'
            ) {
                continue;
            }

            let color;

            if (/rgb.+?\)/.test(computedStyle[property])) {
                // handle transparent body background
                if (
                    element.tagName === 'BODY' &&
                    property === 'backgroundColor' &&
                    computedStyle[property] === 'rgba(0, 0, 0, 0)'
                ) {
                    color = ['255', '255', '255', '1'];
                } else {
                    // filter out color string
                    color = computedStyle[property].match(/(?<=rgba?\().+?(?=\))/)[0].split(', ');
                    color.length === 3 && color.push('1');
                }
                
                // process the color  
                // const rgbaArray = getRgbaArray(color);   
                const colorAsHsl = rgbaToHsla(...color);
                const colorPerceivedBrightness = perceivedBrightness(...color);
                const darkModeHsla = getDarkModeHsla(colorAsHsl, colorPerceivedBrightness);
        
                // apply updated CSS property, which contains the new color
                element.style[property] = computedStyle[property].replace(/rgb.+?\)/, darkModeHsla);
            }

        
        }
        element.hasGottenDarkModeTreatment = true;
    }


    const elements = document.querySelectorAll('body, body *');

    for (const element of elements) {
        convertElementToDarkMode(element);
    }

}
