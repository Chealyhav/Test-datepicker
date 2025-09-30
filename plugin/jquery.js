;(function ($) {
	// Clone Component One By One
	$.fn.ACCloneComponent = function () {
		return this.each(function () {
			var $element = $(this);
			var $btnWrap = $('<div class="btn_wrap">');
			var $btnAdd = $('<button type="button" class="btn btn-success sqare ac_multiwrap_add"><i class="md md-add-circle-outline"></i></button>');

			$element.val('');
			if (!$element.closest('.input-group').length) {
				$element.wrap('<div class="input-group ac_input_multi">');
			}
			var $group = $element.closest('.input-group');
			if (!$group.find('> .btn_wrap').length) {
				$btnWrap.append($btnAdd);
				$group.append($btnWrap);
			}
		});
	};

	function acRandomValueWithSize(n) {
		var s = '';
		var chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
		for (var i = 0; i < (n || 5); i++) {
			s += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		return s;
	}

	function acReArrangeElements(groupClass) {
		var $items = $('.' + groupClass)
			.closest('li')
			.filter(':not(.original)')
			.add($('.' + groupClass).closest('li.original'))
			.sort(function (a, b) { return $(a).index() - $(b).index(); });

		$items.each(function (i) {
			var index = i + 1;
			var $input = $(this).find('.' + groupClass).first();
			var name = $input.attr('name');
			if (!name) { return; }

			var newId = 'id-' + name + '-' + index;
			$input.attr('id', newId);

			var $label = $(this).find('label').first();
			$label.attr('for', newId);

			var $labelSpan = $label.find('span').first();
			var baseText = $labelSpan.text().replace(/\.\d+$/, '');
			$labelSpan.text(baseText + '.' + index);
		});
	}

	$(document).on('click', '.ac_multiwrap_add', function () {
		var $btn = $(this);
		var $li = $btn.closest('li');
		var $inputGroup = $btn.closest('.input-group');
		var $originalInput = $inputGroup.find('input, select, textarea').first();

		var classAttr = $originalInput.attr('class') || '';
		var match = classAttr.match(/cls-mt-[^\s]+/);
		var groupClass = match && match[0];
		if (!groupClass) {
			var name = $originalInput.attr('name');
			if (!name) { alert('Input name missing'); return; }
			groupClass = 'cls-mt-' + name;
			$originalInput.addClass(groupClass);
		}

		var maxAttr = parseInt($originalInput.data('max'), 10);
		if (!isNaN(maxAttr)) {
			var cloneCount = $li.siblings('li:not(.original)').filter(':has(.' + groupClass + ')').length;
			if (cloneCount >= maxAttr) {
				alert('You can add only ' + maxAttr + ' fields maximum.');
				return;
			}
		}

		var $newInput = $originalInput.clone().val('');
		var newId = ($newInput.attr('name') || 'acinput') + '_' + acRandomValueWithSize(5);
		$newInput.attr('id', newId).addClass(groupClass);

		var labelText = $li.find('label span').first().text().replace(/\.\d+$/, '');
		var $label = $('<label for="' + newId + '"><span>' + labelText + '</span></label>');
		var $newLi = $('<li>');
		$newLi.append($('<div>').append($label, $newInput));

		if ($li.length) {
			$li.after($newLi);
		} else {
			$inputGroup.after($('<ul>').append($newLi));
		}

		$newInput.ACCloneComponent();
		if ($newInput.hasClass('ac_datepicker') && $.fn.ACDatePicker) {
			$newInput.ACDatePicker($newInput.data());
		}
		if ($newInput.hasClass('ac_input_combobox') && $.fn.ACComboboxTable) {
			$newInput.ACComboboxTable();
		}

		var $btnWrap = $newLi.find('.btn_wrap');
		if (!$btnWrap.length) {
			$btnWrap = $('<div class="btn_wrap">').appendTo($newInput.parent());
		}
		$btnWrap.append('<button type="button" title="Remove" class="btn btn-outline-danger sqare remove_btn"><i class="md md-remove-circle-outline"></i></button>');

		acReArrangeElements(groupClass);
	});

	$(document).on('click', '.remove_btn', function () {
		var $btn = $(this);
		var $li = $btn.closest('li');
		var $input = $li.find('input, select, textarea').first();
		var classAttr = $input.attr('class') || '';
		var match = classAttr.match(/cls-mt-[^\s]+/);
		var groupClass = match && match[0];
		$li.remove();
		if (groupClass) { acReArrangeElements(groupClass); }
	});
})(jQuery);

