class ZoibanaPhonemask {

    constructor(selector) {
        let that = this;

        if (typeof selector === 'object') {

            that.initEventsOnElement(selector);

        } else {

            document.addEventListener("DOMContentLoaded", function () {
                let inputs = document.querySelectorAll(selector);

                for (let phoneInput of inputs) {
                    that.initEventsOnElement(phoneInput);
                }
            });
        }
    }

    initEventsOnElement(element) {
        element.addEventListener('keydown', (e) => this.onKeyDown(e));
        element.addEventListener('input', (e) => this.onInput(e), false);
        element.addEventListener('paste', (e) => this.onPaste(e), false);
    }

    isRussianNumber(input) {
        let inputNumbersValue = this.inputNumberValue(input);
        return ["7", "8", "9"].indexOf(inputNumbersValue[0]) > -1 && (inputNumbersValue[0] === "7" || input.value[0] !== "+");
    }

    inputNumberValue(input) {
        return input.value.replace(/\D/g, '');
    }

    formatPhoneNumber(inputNumbersValue) {

        // Russian number must be 11 digits length
        if (inputNumbersValue.length > 11) {
            inputNumbersValue = inputNumbersValue.substring(0, 11);
        }

        if (inputNumbersValue[0] === "9") {
            inputNumbersValue = "7" + inputNumbersValue;
        }
        let firstSymbols = (inputNumbersValue[0] === "8") ? "8" : "+7";

        let formattedInputValue = firstSymbols + " ";

        if (inputNumbersValue.length > 1) {
            formattedInputValue += '(' + inputNumbersValue.substring(1, 4);
        }

        if (inputNumbersValue.length >= 5) {
            formattedInputValue += ') ' + inputNumbersValue.substring(4, 7);
        }

        if (inputNumbersValue.length >= 8) {
            formattedInputValue += '-' + inputNumbersValue.substring(7, 9);
        }

        if (inputNumbersValue.length >= 10) {
            formattedInputValue += '-' + inputNumbersValue.substring(9, 11);
        }

        return formattedInputValue;
    }

    onPaste(e) {
        let input = e.target;
        let inputNumbersValue = this.inputNumberValue(input);
        let pasted = e.clipboardData || window.clipboardData;

        if (pasted) {
            let pastedText = pasted.getData('Text');

            if (/\D/g.test(pastedText)) {

                if (!inputNumbersValue) {
                    inputNumbersValue = pastedText.replace(/\D/g, '');
                }

                // Attempt to paste non-numeric symbol — remove all non-numeric symbols,
                // formatting will be in onPhoneInput handler
                input.value = this.formatPhoneNumber(inputNumbersValue);
            }
        }
    }

    onInput(e) {
        let input = e.target;
        let inputNumbersValue = this.inputNumberValue(input);
        let selectionStart = input.selectionStart;
        let formattedInputValue = "";

        if (!inputNumbersValue) {

            if (e.data === '+') {
                return input.value = "+";
            }

            return input.value = "";
        }

        // Editing in the middle of input, not last symbol
        if (input.value.length !== selectionStart) {

            if (input.value[0] !== '+') { // Add "+" if input value starts with not "+"
                let oldSelectionStart = input.selectionStart
                input.value = '+' + input.value;
                input.selectionStart = input.selectionEnd = oldSelectionStart + 1;
            }

            if (e.data && /\D/g.test(e.data)) {
                // Attempt to input non-numeric symbol
                input.value = this.formatPhoneNumber(inputNumbersValue);
                input.selectionStart = input.selectionEnd = selectionStart - 1;
            }

            // do not allow to enter digits if phone length is full
            if (inputNumbersValue.length > 11) {
                input.value = input.value.substring(0, selectionStart - 1) + input.value.substring(selectionStart, 19);
                input.selectionStart = input.selectionEnd = selectionStart - 1;
            }

            return;
        }

        // Russian phone
        if (this.isRussianNumber(input)) {
            formattedInputValue = this.formatPhoneNumber(inputNumbersValue);
        } else {
            // Non-russian phone
            // Ignore formatting, but allow to enter phone
            formattedInputValue = '+' + inputNumbersValue.substring(0, 16);
        }
        input.value = formattedInputValue;
    }

    onKeyDown(e) {

        // Clear input after remove last symbol
        let inputValue = e.target.value.replace(/\D/g, '');

        if (e.keyCode === 8 && inputValue.length <= 1) {

            // Clear input after remove last symbol
            e.target.value = "";

        } else if ([8, 46].indexOf(e.keyCode) > -1 && inputValue.length > 1) {

            // Prevent when removing service symbols
            let symToClear = '';

            switch (e.keyCode) {
                case 8: // BackSpace key
                    symToClear = e.target.value[e.target.selectionStart - 1];
                    break;
                case 46: // Delete key
                    symToClear = e.target.value[e.target.selectionStart];
                    break;
            }
            if (symToClear && /\D/.test(symToClear)) e.preventDefault();
        }
    }

}

module.exports = ZoibanaPhonemask;
