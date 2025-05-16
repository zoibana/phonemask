class ZoibanaPhonemask {
	/**
	 * @param {string|HTMLElement} selector — CSS-селектор или сам input-элемент
	 */
	constructor(selector) {
		if (selector instanceof HTMLElement) {
			this.initEventsOnElement(selector);
		} else if (typeof selector === 'string') {
			const runInit = () => {
				document.querySelectorAll(selector).forEach(el => this.initEventsOnElement(el));
			};
			if (document.readyState === 'loading') {
				document.addEventListener('DOMContentLoaded', runInit);
			} else {
				runInit();
			}
		} else {
			throw new Error('ZoibanaPhonemask: selector must be a string or DOM element');
		}
	}

	/** Удаляет всё, кроме цифр */
	stripNonDigits(str) {
		return String(str).replace(/\D/g, '');
	}

	/** Проверка на российский номер по первой цифре */
	isRussianNumber(digits) {
		return ['7', '8', '9'].includes(digits.charAt(0));
	}

	/**
	 * Форматирует строку цифр:
	 * — для РФ: +7(XXX) XXX-XX-XX
	 * — для остальных: +[цифры]
	 */
	formatPhoneNumber(digits) {
		let clean = this.stripNonDigits(digits);

		if (clean.charAt(0) === '9') {
			clean = '7' + clean;
		}

		const russian = this.isRussianNumber(clean);
		clean = clean.substring(0, russian ? 11 : 16);

		if (russian) {
			const parts = ['+7'];
			if (clean.length > 1) parts.push('(' + clean.slice(1, 4) + ')');
			if (clean.length > 4) parts.push(' ' + clean.slice(4, 7));
			if (clean.length > 7) parts.push('-' + clean.slice(7, 9));
			if (clean.length > 9) parts.push('-' + clean.slice(9, 11));
			return parts.join('');
		} else {
			return '+' + clean;
		}
	}

	/**
	 * По отформатированной строке находит позицию курсора,
	 * соответствующую заданному количеству цифр до курсора.
	 * digitCount — число цифровых символов слева от курсора.
	 */
	findCursorPos(formatted, digitCount) {
		let count = 0;
		for (let i = 0; i < formatted.length; i++) {
			if (/\d/.test(formatted[i])) {
				count++;
				if (count === digitCount) {
					// ставим курсор **после** этого символа
					return i + 1;
				}
			}
		}
		// если не нашли (например, digitCount=0), возвращаем 0 или конец
		return digitCount === 0 ? 0 : formatted.length;
	}

	/** Навешиваем обработчики на конкретный input */
	initEventsOnElement(element) {
		element.addEventListener('keydown', e => this.onKeyDown(e));
		element.addEventListener('input', e => this.onInput(e), false);
		element.addEventListener('paste', e => this.onPaste(e), false);

		if (element.value) {
			const digits = this.stripNonDigits(element.value);
			element.value = digits ? this.formatPhoneNumber(digits) : '';
		}
	}

	/** Перехватываем вставку, форматируем и сохраняем курсор в конец вставленных цифр */
	onPaste(e) {
		e.preventDefault();
		const input = e.target;
		const pasted = (e.clipboardData || window.clipboardData).getData('text');
		const newDigits = this.stripNonDigits(pasted);
		const existing = this.stripNonDigits(input.value);
		const combined = existing + newDigits;

		const formatted = combined ? this.formatPhoneNumber(combined) : '';
		input.value = formatted;

		// ставим курсор после всех вставленных цифр
		const totalDigits = this.stripNonDigits(formatted).length;
		const pos = this.findCursorPos(formatted, totalDigits);
		input.setSelectionRange(pos, pos);
	}

	/** Обработка ввода: формат + сохранение курсора */
	onInput(e) {
		if (!e.isTrusted) return;
		const input = e.target;

		// если пользователь лишь ввёл "+"
		if (input.value === '+') {
			return;
		}

		// запомним позицию и число цифр до неё
		const prevPos = input.selectionStart;
		const rawValue = input.value;
		let digitsCount = 0;
		for (let i = 0; i < prevPos; i++) {
			if (/\d/.test(rawValue[i])) digitsCount++;
		}

		const digits = this.stripNonDigits(rawValue);
		if (!digits) {
			input.value = '';
			return;
		}

		const formatted = this.formatPhoneNumber(digits);
		input.value = formatted;

		// вычислим, где курсор должен оказаться
		const newPos = this.findCursorPos(formatted, digitsCount);
		input.setSelectionRange(newPos, newPos);
	}

	/**
	 * При попытке удалить служебный символ —
	 * «перескакиваем» через него, не сбрасывая курсор в конец.
	 */
	onKeyDown(e) {
		const input = e.target;
		const pos = input.selectionStart;
		const val = input.value;
		const digits = this.stripNonDigits(val);
		const fmtChars = ['(', ')', ' ', '-'];

		if (e.key === 'Backspace') {
			if (digits.length <= 1) {
				e.preventDefault();
				input.value = '';
				return;
			}
			if (pos > 0 && fmtChars.includes(val.charAt(pos - 1))) {
				e.preventDefault();
				// перескочить через символ форматирования влево
				input.setSelectionRange(pos - 1, pos - 1);
			}
		}

		if (e.key === 'Delete') {
			if (digits.length > 1 && fmtChars.includes(val.charAt(pos))) {
				e.preventDefault();
				// перескочить через символ форматирования вправо
				input.setSelectionRange(pos + 1, pos + 1);
			}
		}
	}
}

module.exports = ZoibanaPhonemask;
