/**
 * License: MIT
 * Credits: https://stackoverflow.com/a/44384948
 * Repo: https://github.com/swissup/range-slider
 */

class RangeSlider extends HTMLElement {
    connectedCallback() {
        RangeSlider.addStyles();
        this.addMarkup();
        this.addEventListener('touchstart', this.onMouseDown.bind(this), { passive: true });
        this.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.addEventListener('touchend', this.onMouseUp.bind(this));
        this.addEventListener('mouseup', this.onMouseUp.bind(this));
        this.addEventListener('input', this.onInput.bind(this));
    }

    get value() {
        return [this.min.valueAsNumber, this.max.valueAsNumber].sort((a, b) => a - b);
    }

    set value(value) {
        this.min.value = Math.min(...value);
        this.max.value = Math.max(...value);
    }

    addMarkup() {
        if (!this.querySelector(':nth-child(1)')) {
            this.insertAdjacentHTML('afterbegin', [
                '<input class="range" type="range"/>',
                '<input class="range" type="range"/>',
                '<input class="filler" disabled type="range"/>',
            ].join(''));
        }

        this.initMinMaxElements();

        let mapping = {
            step: this.getAttribute('step') || 1,
            min: this.getAttribute('min') || 0,
            max: this.getAttribute('max') || 100
        };

        for (let [key, value] of Object.entries(mapping)) {
            this.min[key] = value;
            this.max[key] = value;
        };

        let value = (this.getAttribute('value') || '').split('-').filter((val) => val);

        if (value.length) {
            this.min.value = value[0];
            this.max.value = value[1] || this.max.max;
        } else {
            this.min.value = this.min.min;
            this.max.value = this.max.max;
        }
    }

    initMinMaxElements() {
        this.min = this.querySelector(':nth-child(1)');
        this.max = this.querySelector(':nth-child(2)');

        let name = this.getAttribute('name');

        if (name) {
            this.min.name = name + '[min]';
            this.max.name = name + '[max]';
        }
    }

    /**
     * Allow to move min above max and vice versa
     */
    onMouseDown() {
        this.constraint = (this.max.valueAsNumber - this.min.valueAsNumber) > Math.min(this.min.step, 1) * 5;
    }

    /**
     * If min thumb was moved above max (or vice versa) - swap them
     */
    onMouseUp() {
        if (this.constraint) {
            return;
        }

        this.constraint = true;

        if (this.min.valueAsNumber < this.max.valueAsNumber) {
            return;
        }

        this.insertBefore(this.max, this.min);
        this.initMinMaxElements();
    }

    /**
     * Contstrain thumbs inside their min/max values
     */
    onInput(event) {
        if (this.constraint) {
            let el = event.target;

            if (el === this.min) {
                if (el.valueAsNumber > this.max.valueAsNumber) {
                    el.value = this.max.value;
                }
            } else if (el.valueAsNumber < this.min.valueAsNumber) {
                el.value = this.min.value;
            }
        }

        this.dispatchEvent(new Event('range:input', {
            bubbles: true
        }));
    }

    disconnectedCallback() {
        this.removeEventListener('touchstart', this.onMouseDown);
        this.removeEventListener('mousedown', this.onMouseDown);
        this.removeEventListener('touchend', this.onMouseUp);
        this.removeEventListener('mouseup', this.onMouseUp);
        this.removeEventListener('input', this.onInput);
    }

    static addStyles() {
        if (RangeSlider.styled) {
            return;
        }

        const style = document.createElement('style');

        style.innerText = `
            range-slider {
                --thumb-width: 16px;
                --thumb-height: var(--thumb-width);
                --thumb-mobile-scale: 1.4;
                --thumb-mobile-width: calc(var(--thumb-width) * var(--thumb-mobile-scale));
                --thumb-mobile-height: calc(var(--thumb-height) * var(--thumb-mobile-scale));
                --thumb-border: 1px solid #fff;
                --thumb-border-radius: 999px;
                --thumb-bg: 10 89 254;
                --thumb-mobile-scale: 1.4;
                --track-height: 4px;
                --track-border-radius: var(--thumb-border-radius);
                --track-bg: 234 234 234;

                position: relative;
                display: inline-block;
            }
            range-slider input {
                margin: 0;
                width: 100%;
                -webkit-appearance: none;
            }
            range-slider input:focus {
                outline: 0;
            }
            range-slider::before,
            range-slider input::-webkit-slider-runnable-track {
                background: rgb(var(--track-bg));
                height: var(--track-height);
                border-radius: var(--track-border-radius);
            }
            range-slider input::-webkit-slider-thumb {
                -webkit-appearance: none;
                cursor: pointer;
                background: rgba(var(--thumb-bg) / .9);
                border: var(--thumb-border);
                border-radius: var(--thumb-border-radius);
                height: var(--thumb-height);
                width: var(--thumb-width);
                margin-top: calc(var(--track-height) / 2 - var(--thumb-height) / 2);
                transition: box-shadow 200ms ease-out;
            }
            @media (pointer:coarse) {
                range-slider input::-webkit-slider-thumb {
                    --thumb-height: var(--thumb-mobile-height);
                    --thumb-width: var(--thumb-mobile-width);
                }
            }
            range-slider input:focus::-webkit-slider-thumb,
            range-slider input:active::-webkit-slider-thumb {
                box-shadow: 0 0 0 3px rgba(var(--thumb-bg) / .2);
            }
            range-slider input::-moz-range-thumb {
                -webkit-appearance: none;
                cursor: pointer;
                background: rgba(var(--thumb-bg) / .9);
                border: var(--thumb-border);
                border-radius: var(--thumb-border-radius);
                height: var(--thumb-height);
                width: var(--thumb-width);
                margin-top: calc(var(--track-height) / 2 - var(--thumb-height) / 2);
                transition: box-shadow 200ms;
                transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
            }
            range-slider input:focus::-moz-range-thumb {
                box-shadow: 0 0 0 3px rgba(var(--thumb-bg) / .2);
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
            range-slider .range:first-child::-webkit-slider-thumb {
                z-index: 3;
            }

            @-moz-document url-prefix() {
                range-slider .range::-moz-range-track {
                    background: transparent !important;
                }
                range-slider::before {
                    content: '';
                    width: 100%;
                    position: absolute;
                    top: calc(50% - 4px / 2);
                }
                range-slider .range {
                    top: calc(50% + 20px);
                }
                range-slider .range::-moz-range-thumb {
                    transform: translateY(-20px);
                }
            }
            `;

        document.head.append(style);

        RangeSlider.styled = true;
    }
}

customElements.define('range-slider', RangeSlider);
