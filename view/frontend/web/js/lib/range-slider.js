/**
 * Html range slider component with two thumbs.
 *
 * Credits: https://stackoverflow.com/a/44384948
 */

class RangeSlider extends HTMLElement {
    connectedCallback() {
        RangeSlider.addStyles();

        this.insertAdjacentHTML('afterbegin', [
            '<input class="range min" type="range" min="1" max="100" value="10" />',
            '<input class="range max" type="range" min="1" max="100" value="90" />',
            '<input class="filler" disabled type="range" />',
        ].join(''));

        const [min, max] = this.querySelectorAll('[type="range"]');

        if (this.dataset.name) {
            min.name = this.dataset.name + '[min]';
            max.name = this.dataset.name + '[max]';
        }

        /**
         * Bring max or min above another range, if we can move only one of the thumbs
         */
        this.addEventListener('mousemove', function (event) {
            if (max.valueAsNumber < parseFloat(min.min) + 5) {
                max.style.zIndex = 4;
            } else if (min.valueAsNumber > parseFloat(max.max) - 5) {
                min.style.zIndex = 4;
            } else {
                max.style.zIndex = null;
                min.style.zIndex = null;
            }
        });

        /**
         * Contstrain thumbs inside their min/max values
         */
        this.addEventListener('input', function (event) {
            let el = event.target,
                minDiff = 5,
                maxValue = max.valueAsNumber - minDiff,
                minValue = min.valueAsNumber + minDiff;

            if (el === min) {
                if (el.value > maxValue) {
                    el.value = maxValue;
                }
            } else if (el.value < minValue) {
                el.value = minValue;
            }
        });
    }

    static addStyles() {
        if (RangeSlider.styled) {
            return;
        }

        const style = document.createElement('style');

        style.innerText = `
            range-slider {
                position: relative;
                display: inline-block;
            }
            range-slider input {
                margin: 0;
            }
            range-slider input::-webkit-slider-runnable-track {
                background: #ddd;
                height: 4px;
                border-radius: 999px;
            }
            range-slider input::-webkit-slider-thumb {
                height: 16px;
                width: 16px;
                margin-top: -6px;
            }
            range-slider .filler {
                opacity: 0;
                visibility: hidden;
                pointer-events: none;
            }
            range-slider .range {
                position: absolute;
                left: 0;
                top: 50%;
                height: 0 !important;
                overflow: visible;
            }
            range-slider .range::-webkit-slider-thumb {
                position: relative;
                z-index: 2;
            }
            range-slider .min::-webkit-slider-thumb {
                z-index: 3;
            }

            @-moz-document url-prefix() {
                range-slider .range::-moz-range-track {
                    background: transparent !important;
                }
                range-slider::before {
                    content: '';
                    width: 100%;
                    height: 4px;
                    border-radius: 999px;
                    background: #ddd;
                    display: block;
                    position: absolute;
                    top: calc(50% - 4px / 2);
                }
                range-slider .range {
                    top: calc(50% + 20px);
                }
                range-slider .range::-moz-range-thumb {
                    cursor: pointer;
                    transform: translateY(-20px);
                }
            }
            `;

        document.head.append(style);

        RangeSlider.styled = true;
    }
}

customElements.define('range-slider', RangeSlider);
