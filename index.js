class ZoibanaPhonemask {

    constructor(selector) {
        let that = this;

        document.addEventListener("DOMContentLoaded", function () {
            let inputs = document.querySelectorAll(selector);

            for (let phoneInput of inputs) {
                phoneInput.addEventListener('keydown', (e) => that.onKeyDown(e));
                phoneInput.addEventListener('input', (e) => that.onInput(e), false);
                phoneInput.addEventListener('paste', (e) => that.onPaste(e), false);
            }
        });
    }

    inputNumberValue(input) {
        return input.value.replace(/\D/g, '');
    }

    onPaste(e) {
        let input = e.target;
        let inputNumbersValue = this.inputNumberValue(input);
        let pasted = e.clipboardData || window.clipboardData;

        if (pasted) {
            let pastedText = pasted.getData('Text');

            if (/\D/g.test(pastedText)) {
                // Attempt to paste non-numeric symbol — remove all non-numeric symbols,
                // formatting will be in onPhoneInput handler
                input.value = inputNumbersValue;
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

            if (input.value[0] !== '+') { // Add "+" if input value startswith not "+"
                let oldSelectionStart = input.selectionStart
                input.value = '+' + input.value;
                input.selectionStart = input.selectionEnd = oldSelectionStart + 1;
            }

            if (e.data && /\D/g.test(e.data)) {
                // Attempt to input non-numeric symbol
                input.value = inputNumbersValue;
            }
            return;
        }

        if (["7", "8", "9"].indexOf(inputNumbersValue[0]) > -1 && inputNumbersValue.length <= 11
            && (inputNumbersValue[0] === "7" || input.value[0] !== "+")) {
            if (inputNumbersValue[0] === "9") {
                inputNumbersValue = "7" + inputNumbersValue;
            }
            let firstSymbols = (inputNumbersValue[0] === "8") ? "8" : "+7";

            formattedInputValue = input.value = firstSymbols + " ";

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
        } else {
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
