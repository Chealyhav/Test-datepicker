(function ($) {
    // ======================
    // HELPER FUNCTIONS (TOP-LEVEL SCOPE)
    // ======================
    function acRandomValueWithSize(n) {
        var s = '';
        var chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        for (var i = 0; i < (n || 5); i++) {
            s += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return s;
    }

    function acSlugify(text) {
        if (!text) { return 'field'; }
        return String(text)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '') || 'field';
    }

    function acEnsureNameAndClass($input) {
        var name = $input.attr('name');
        if (!name) {
            var lbl = $input.closest('li').find('label span').first().text() ||
                $input.closest('li').find('label').first().text() ||
                $input.attr('id');
            name = acSlugify(lbl);
            $input.attr('name', name);
        }
        var classAttr = $input.attr('class') || '';
        var match = classAttr.match(/cls-mt-[^\s]+/);
        var groupClass = match && match[0];
        if (!groupClass) {
            groupClass = 'cls-mt-' + name;
            $input.addClass(groupClass);
        }
        return groupClass;
    }

    function acReArrangeElements(groupClass) {
        var $items = $('.' + groupClass)
            .closest('li')
            .filter(':not(.original)')
            .add($('.' + groupClass).closest('li.original'))
            .sort(function (a, b) { return $(a).index() - $(b).index(); });

        $items.each(function (i) {
            var index = i + 1;
            var $allInputs = $(this).find('input, select, textarea');
            $allInputs.each(function (j) {
                var $inp = $(this);
                var prevId = $inp.attr('id');
                var name = $inp.attr('name') || ('field' + (j + 1));
                var newId = 'id-' + name + '-' + index + '-' + (j + 1);
                $inp.attr('id', newId);

                var $labelMatch = prevId ? $("label[for='" + prevId + "']") : $();
                if (!$labelMatch.length) {
                    var $sib = $inp.next('label');
                    $labelMatch = $sib.length ? $sib : $(this).closest('li').find('label').eq(j);
                }

                if ($labelMatch && $labelMatch.length) {
                    $labelMatch.attr('for', newId);
                }
            });

            var $firstLabel = $(this).find('label').first();
            if ($firstLabel.length) {
                if ($firstLabel.find('span').length === 0) {
                    $firstLabel.wrapInner('<span></span>');
                }
                var $sp = $firstLabel.find('span').first();
                var baseText = $sp.text().replace(/\.\d+$/, '');
                $sp.text(baseText + '.' + index);
            }
        });
    }

    // ======================
    // PLUGIN DEFINITIONS
    // ======================
    $.fn.ACRadioButton = function (options) {
        var defaults = {
            required: false,
            props: [],
            inputPlaceholder: '',
            layout: 'row'
        };

        if (typeof options === 'string') {
            var args = Array.prototype.slice.call(arguments, 1);
            var returnValue;
            this.each(function () {
                var $el = $(this);
                var instance = $el.data('acRadioButton');
                if (!instance) {
                    var $parentGroup = $el.closest('.ac-radio-group');
                    if ($parentGroup.length) { instance = $parentGroup.data('acRadioButton'); }
                }
                if (!instance) { return; }
                if (instance.methods[options]) {
                    returnValue = instance.methods[options].apply(instance, args);
                } else {
                    $.error('Method ' + options + ' does not exist on jQuery.ACRadioButton');
                }
            });
            return returnValue !== undefined ? returnValue : this;
        }

        return this.each(function () {
            var $group = $(this);
            var $origin = $group;
            var settings = $.extend({}, defaults, options);

            if ($group.is('input[type="radio"]')) {
                var name = settings.name || $group.attr('name');
                $group = $group.wrapAll('<div class="ac-radio-group"></div>').parent();
                $group.find('input[type="radio"]').attr('name', name);
            }

            var existingName = $group.find('input[type="radio"]').first().attr('name') || null;
            var groupName = settings.name || existingName || ('acgroup_' + Math.random().toString(36).substr(2, 9));

            if (Array.isArray(settings.props) && settings.props.length > 0) {
                $group.empty();
                for (var i = 0; i < settings.props.length; i++) {
                    var item = settings.props[i] || {};
                    var itemId = item.id || ('acradio_' + Math.random().toString(36).substr(2, 9));
                    var itemValue = item.value != null ? String(item.value) : itemId;
                    var itemLabel = item.label != null ? String(item.label) : itemValue;
                    var $input = $('<input type="radio" class="box-radio">')
                        .attr({ name: groupName, id: itemId, value: itemValue, 'data-label': itemLabel });
                    if (item.checked) { $input.prop('checked', true); }
                    $group.append($input);
                }
            }

            var $radios = $group.find('input[type="radio"]');
            if ($radios.length === 0) { return; }

            $radios.attr('name', groupName);
            if (settings.layout === 'row') {
                $group.css({
                    display: 'flex',
                    gap: '14px',
                    alignItems: 'center',
                    flexWrap: 'wrap'
                });
                $group.find('.ac-radio-wrapper').css('margin', '0');
            } else if (settings.layout === 'col') {
                $group.css({
                    display: 'flex',
                    gap: '10px',
                    flexDirection: 'column'
                });
            }

            $radios.each(function () {
                var $radio = $(this);
                var id = $radio.attr('id') || ('acradio_' + Math.random().toString(36).substr(2, 9));
                $radio.attr('id', id);
                if (!$radio.next('label').length) {
                    var label = $radio.attr('data-label') || $radio.val();
                    $radio.after('<label for="' + id + '" class="ac-radio-label" style="margin-left: 5px;">' + label + '</label>');
                }
                var $wrapper = $('<div class="ac-radio-wrapper"></div>');
                $radio.add($radio.next('label')).wrapAll($wrapper);
            });

            $group.addClass('ac-radio-group');
            if (settings.required) { $radios.prop('required', true); }

            $group.on('change', 'input[type="radio"]', function () {
                $radios.not(this).closest('.ac-radio-wrapper').removeClass('checked');
                $(this).closest('.ac-radio-wrapper').addClass('checked');
            });

            $radios.filter(':checked').trigger('change');

            var instance = {
                $group: $group,
                $radios: $radios,
                $origin: $origin,
                settings: settings,
                methods: {
                    getValue: function () {
                        var v = this.$radios.filter(':checked').val();
                        return v || null;
                    },
                    setValue: function (val) {
                        var $target = this.$radios.filter('[value="' + val + '"]');
                        if ($target.length) { $target.prop('checked', true).trigger('change'); }
                        return this;
                    },
                    enable: function () {
                        this.$radios.prop('disabled', false);
                        this.$group.removeClass('disabled');
                        return this;
                    },
                    disable: function () {
                        this.$radios.prop('disabled', true);
                        this.$group.addClass('disabled');
                        return this;
                    },
                    clear: function () {
                        this.$radios.prop('checked', false);
                        this.$group.find('.ac-radio-wrapper').removeClass('checked');
                        this.$radios.first().trigger('change');
                        return this;
                    }
                }
            };

            $group.data('acRadioButton', instance);
            $origin.data('acRadioButton', instance);

            var idName = settings.inputId || (groupName + '_input');
            var required = defaults.required;
            var $newInput;

            if ($origin && $origin.is('input[type="radio"]')) {
                $newInput = $origin;
                $newInput.attr('type', 'hidden');
                $newInput.attr('name', (settings.inputName || groupName));
                $newInput.prop('required', required);
                if (idName && $newInput.attr('id')) { idName = $newInput.attr('id'); }
                $newInput.addClass('form-control ac_radio');
                $group.after($newInput);
            } else {
                var $wrapper = $('<div>').addClass('ac_form');
                var $el = $group;
                $newInput = $('<input>')
                    .attr({
                        type: 'hidden',
                        id: idName,
                        name: (settings.inputName || groupName),
                        placeholder: ($el.attr('placeholder') || settings.inputPlaceholder || '')
                    })
                    .addClass('form-control ac_radio')
                    .prop('required', required);
                $wrapper.append($newInput);
                $group.after($wrapper);
                $wrapper.hide();
            }

            var updateMirror = function () {
                var v = instance.methods.getValue.call(instance);
                $newInput.val(v || '');
                if (instance.$origin && instance.$origin.length) {
                    instance.$origin.val(v || '');
                }
            };

            updateMirror();
            $group.on('change.acmirror', 'input[type="radio"]', updateMirror);
            instance.updateMirror = updateMirror;

            $newInput.on('change input', function () {
                var v = $(this).val();
                instance.methods.setValue.call(instance, v);
            });

            $group.on('change', 'input[type="radio"]', function () {
                var v = $(this).val();
                $newInput.val(v);
            });
        });
    };

    // Removed broken ACComboboxTable (was incomplete/invalid)

    $.fn.ACDatePicker = function (options) {
        var defaults = {
            required: false,
            format: 'DD-MMM-YYYY',
            inputPlaceholder: 'DD MMM YYYY',
            min: null,
            max: null
        };
        var settings = $.extend({}, defaults, options);

        function formatDateForOutput(date) {
            if (!date) { return ''; }
            var d = new Date(date);
            if (isNaN(d.getTime())) { return ''; }
            var dd = String(d.getDate()).padStart(2, '0');
            var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
            var mmm = months[d.getMonth()];
            var yyyy = d.getFullYear();
            return dd + '-' + mmm + '-' + yyyy;
        }

        return this.each(function () {
            var $origin = $(this);
            var initial = $origin.val();
            var minAttr = $origin.attr('min') || settings.min;
            var maxAttr = $origin.attr('max') || settings.max;

            var $visible = $('<input>')
                .attr({ type: 'date', class: 'form-control ac_datepicker_visible' })
                .prop('required', settings.required || $origin.prop('required'));

            if (minAttr) { $visible.attr('min', minAttr); }
            if (maxAttr) { $visible.attr('max', maxAttr); }

            if (initial) {
                var parsed = new Date(initial);
                if (!isNaN(parsed.getTime())) {
                    $visible.val(parsed.toISOString().slice(0,10));
                }
            }

            var $group = $('<div class="input-group ac_datepicker_group"></div>');
            var $btn = $('<button class="btn btn-outline-secondary" type="button" tabindex="-1">🗓</button>');
            $group.append($visible).append($btn);

            $origin.addClass('ac_datepicker').attr('type', 'hidden');
            if (!$origin.hasClass('form-control')) { $origin.addClass('form-control'); }
            $origin.after($group);

            var setMirror = function () {
                var raw = $visible.val();
                $origin.val(formatDateForOutput(raw));
            };
            setMirror();

            $visible.on('change input', setMirror);
            $btn.on('click', function () { $visible.trigger('focus'); });
        });
    };

    $.fn.ACInput = function (options) {
        var defaults = {
            required: false,
            inputPlaceholder: '',
            icon: null,
            enableClone: true
        };
        var settings = $.extend({}, defaults, options);

        return this.each(function () {
            var $el = $(this);
            if (!$el.hasClass('form-control')) { $el.addClass('form-control'); }
            if (settings.inputPlaceholder && !$el.attr('placeholder')) {
                $el.attr('placeholder', settings.inputPlaceholder);
            }
            if (settings.required) { $el.prop('required', true); }

            if (!$el.closest('.input-group').length) {
                $el.wrap('<div class="input-group"></div>');
            }
            var $group = $el.closest('.input-group');

            if (!$group.find('.input-group-text.ac-input-icon').length) {
                var iconText = settings.icon || $el.data('icon');
                var iconClass = $el.data('icon-class');
                if (iconClass) {
                    $group.append('<span class="input-group-text ac-input-icon"><i class="' + iconClass + '"></i></span>');
                } else if (iconText) {
                    $group.append('<span class="input-group-text ac-input-icon">' + iconText + '</span>');
                }
            }

            if (settings.enableClone && $.fn.ACCloneComponent) {
                $el.ACCloneComponent();
            }
        });
    };

    // Input Type Shortcuts
    $.fn.ACInputMulti = function (options) {
        return this.ACInput($.extend({ icon: '➕' }, options));
    };

    $.fn.ACInputNumber = function (options) {
        return this.each(function(){
            var $el = $(this);
            $el.attr('type', 'number');
            $el.ACInput($.extend({ icon: '#' }, options));
        });
    };

    $.fn.ACInputPassword = function (options) {
        return this.each(function(){
            var $el = $(this);
            $el.attr('type', 'password');
            $el.ACInput($.extend({ icon: '👁' }, options));
        });
    };

    $.fn.ACInputSelect = function (options) {
        var defaults = { required: false };
        var settings = $.extend({}, defaults, options);
        return this.each(function(){
            var $el = $(this);
            if (!$el.hasClass('form-select')) { $el.addClass('form-select'); }
            if (settings.required) { $el.prop('required', true); }
            if (!$el.closest('.input-group').length) { $el.wrap('<div class="input-group"></div>'); }
            if ($.fn.ACCloneComponent) { $el.ACCloneComponent(); }
        });
    };

    $.fn.ACInputText = function (options) {
        return this.each(function(){
            var $el = $(this);
            $el.attr('type', 'text');
            $el.ACInput($.extend({ icon: '🔤' }, options));
        });
    };

    $.fn.ACInputTextarea = function (options) {
        var defaults = { required: false };
        var settings = $.extend({}, defaults, options);
        return this.each(function(){
            var $el = $(this);
            if (!$el.hasClass('form-control')) { $el.addClass('form-control'); }
            if (settings.required) { $el.prop('required', true); }
            if (settings.inputPlaceholder && !$el.attr('placeholder')) { $el.attr('placeholder', settings.inputPlaceholder); }
            if (!$el.closest('.input-group').length) { $el.wrap('<div class="input-group"></div>'); }
            if ($.fn.ACCloneComponent) { $el.ACCloneComponent(); }
        });
    };

    $.fn.ACInputTime = function (options) {
        return this.each(function(){
            var $el = $(this);
            $el.attr('type', 'time');
            $el.ACInput($.extend({ icon: '⏱' }, options));
        });
    };

    $.fn.ACInputDate = function (options) {
        return this.each(function(){
            var $el = $(this);
            $el.addClass('dpicker');
            $el.ACDatePicker(options);
        });
    };

    $.fn.ACInputDateTime = function (options) {
        return this.each(function(){
            var $el = $(this);
            var $date = $('<input type="hidden" class="form-control dpicker" />');
            $el.after($date);
            $date.ACDatePicker(options);
            $el.attr('type','time').ACInput($.extend({ icon: '📅' }, options));
        });
    };

    $.fn.ACInputFile = function (options) {
        return this.each(function(){
            var $el = $(this);
            $el.attr('type','file');
            if (!$el.closest('.input-group').length) { $el.wrap('<div class="input-group"></div>'); }
            if (!$el.hasClass('form-control')) { $el.addClass('form-control'); }
        });
    };

    // ======================
    // CLONE COMPONENTS
    // ======================
    $.fn.ACCloneComponent = function () {
        return this.each(function () {
            var $element = $(this);
            var $btnWrap = $('<div class="btn_wrap">');
            var $btnAdd = $('<button type="button" class="btn sqare ac_multiwrap_add"><i class="fa fa-plus"></i></button>');

            $element.val('');
            if (!$element.closest('.input-group').length) {
                $element.wrap('<div class="input-group ac_input_multi">');
            }
            var $group = $element.closest('.input-group');
            var $li = $group.closest('li');
            if (!$li.length) {
                $group.wrap('<li class="ac-item original"></li>');
            }
            if (!$group.find('> .btn_wrap').length) {
                $btnWrap.append($btnAdd);
                $group.append($btnWrap);
            }
        });
    };

    $.fn.ACCloneComponentByGroup = function () {
        return this.each(function () {
            var $el = $(this);
            var $group = $el.closest('.input-group');
            if (!$group.length) { return; }

            var $btnWrap = $group.find('> .btn_wrap');
            if (!$btnWrap.length) { $btnWrap = $('<div class="btn_wrap">').appendTo($group); }
            if (!$btnWrap.find('.ac_group_add').length) {
                $btnWrap.append('<button type="button" class="btn btn-success sqare ac_group_add" title="Add group"><i class="fa fa-plus"></i></button>');
            }

            var $li = $group.closest('li');
            if ($li.length && !$li.hasClass('original')) { $li.addClass('original'); }
        });
    };

    // ======================
    // EVENT HANDLERS
    // ======================
    $(document).on('click', '.ac_multiwrap_add', function () {
        var $btn = $(this);
        var $li = $btn.closest('li');
        var $inputGroup = $btn.closest('.input-group');
        var $originalInput = $inputGroup.find('input, select, textarea').first();

        var groupClass = acEnsureNameAndClass($originalInput);

        var maxAttr = parseInt($originalInput.data('max'), 10);
        if (!isNaN(maxAttr)) {
            var cloneCount = $li.siblings('li:not(.original)').filter(':has(.' + groupClass + ')').length;
            if (cloneCount >= maxAttr) {
                alert('You can add only ' + maxAttr + ' fields maximum.');
                return;
            }
        }

        var $newLi = $li.clone(true, true).removeClass('original');
        $newLi.find('input, select, textarea').each(function(){
            var $inp = $(this);
            if ($inp.is(':checkbox,:radio')) { $inp.prop('checked', false); }
            else { $inp.val(''); }
        });

        var $btnWrap = $newLi.find('> .input-group > .btn_wrap');
        if (!$btnWrap.length) { $btnWrap = $('<div class="btn_wrap">').appendTo($newLi.find('> .input-group')); }
        if (!$btnWrap.find('.remove_btn').length) {
            $btnWrap.append('<button type="button" title="Remove" class="btn btn-outline-danger sqare remove_btn"><i class="fa fa-minus"></i></button>');
        }

        $li.after($newLi);
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


    // ======================
    // HELPER: Clean label text
    // ======================
    function getCleanLabel(labelText) {
        var cleaned = String(labelText || '').trim();
        // Remove patterns like "2.1", "Text Box 2.1", "2.1 Text Box", etc.
        cleaned = cleaned.replace(/\s*\d+\.\d+\s*/g, ' '); // Remove " 2.1 "
        cleaned = cleaned.replace(/^\s*\d+\.\d+\s*/, '');  // Remove "2.1 "
        cleaned = cleaned.replace(/\s*\d+\.\d+$/g, '');    // Remove " 2.1"
        cleaned = cleaned.replace(/[\.:]+$/, '').trim();   // Remove trailing dots/colons
        return cleaned || 'Field';
    }

    // ======================
    // CLONE COMPONENTS
    // ======================
    $.fn.ACCloneComponent = function () {
        return this.each(function () {
            var $element = $(this);
            if (!$element.closest('.input-group').length) {
                $element.wrap('<div class="input-group"></div>');
            }
            var $group = $element.closest('.input-group');
            var $btnWrap = $group.find('.btn_wrap');
            if (!$btnWrap.length) {
                $btnWrap = $('<div class="btn_wrap">').appendTo($group);
            }
            if (!$btnWrap.find('.ac_multiwrap_add').length) {
                $btnWrap.append(
                    '<button type="button" class="btn btn-outline-secondary btn-sm ac_multiwrap_add">' +
                    '<i class="fa fa-plus"></i></button>'
                );
            }
        });
    };

    $.fn.ACCloneComponentByGroup = function () {
        return this.each(function () {
            var $ul = $(this);
            var groupIndex = $ul.data('group-index') || "";
            $ul.data('group-index', groupIndex);

            // Add group header
            if (!$ul.find('.group-header').length) {
                var $header = $('<div class="group-header d-flex justify-content-between align-items-center mb-2 p-2 bg-light rounded">')
                    .append('<strong>Group ' + groupIndex + '</strong>')
                    .append(
                        $('<button type="button" class="btn btn-outline-danger btn-sm remove-group">')
                            .html('<i class="fa fa-trash"></i>')
                    );
                $ul.prepend($header);
            }

            // Add "Add Group" button after <ul>
            if (!$ul.next('.ac_group_add_wrapper').length) {
                var $wrapper = $('<div class="ac_group_add_wrapper mt-3">');
                var $btn = $('<button type="button" class="btn btn-success ac_group_add w-100">')
                    .html('<i class="fa fa-plus"></i> Add Group');
                $wrapper.append($btn);
                $ul.after($wrapper);
            }

            // Initialize field cloning for this group
            $ul.find('input, select, textarea').each(function() {
                var $el = $(this);
                var type = $el.attr('type') || $el.prop('tagName').toLowerCase();
                if (type === 'text') $el.ACInputText();
                else if (type === 'number') $el.ACInputNumber();
                else if (type === 'textarea') $el.ACInputTextarea();
                else if ($el.is('select')) $el.ACInputSelect();
            });

            // Number original fields
            $ul.find('li').each(function(i) {
                var $label = $(this).find('label').first();
                if ($label.length) {
                    var clean = getCleanLabel($label.text());
                    $label.html('<span class="field-number">' + clean + groupIndex + '.</span>');
                }
            });
        });
    };

    // ======================
    // EVENT HANDLERS
    // ======================
    $(document).on('click', '.ac_group_add', function(){
        var $btn = $(this);
        var $originalUl = $btn.closest('.ac_group_add_wrapper').prev('ul.clone-group');
        if (!$originalUl.length) return;

        var newGroupIndex = $('ul.clone-group').length + 1;
        var $newUl = $originalUl.clone(true, true);
        $newUl.data('group-index', newGroupIndex);

        // Update group header
        $newUl.find('.group-header').remove();
        var $header = $('<div class="group-header d-flex justify-content-between align-items-center mb-2 p-2 bg-light rounded">')
            .append('<strong>Group ' + newGroupIndex + '</strong>')
            .append(
                $('<button type="button" class="btn btn-outline-danger btn-sm remove-group">')
                    .html('<i class="fa fa-trash"></i>')
            );
        $newUl.prepend($header);

        // Update field labels
        $newUl.find('li').each(function(i) {
            var $label = $(this).find('label').first();
            if ($label.length) {
                var clean = getCleanLabel($label.text());
                $label.html('<span class="field-number">' + newGroupIndex + '</span> ' + clean);
            }
        });

        // Insert after original
        $originalUl.after($newUl);

        // Re-initialize components in clone
        $newUl.find('input, select, textarea').each(function() {
            var $el = $(this);
            var type = $el.attr('type') || $el.prop('tagName').toLowerCase();
            if (type === 'text') $el.ACInputText();
            else if (type === 'number') $el.ACInputNumber();
            else if (type === 'textarea') $el.ACInputTextarea();
            else if ($el.is('select')) $el.ACInputSelect();
        });
    });

    $(document).on('click', '.remove-group', function() {
        $(this).closest('ul.clone-group').remove();
    });


})(jQuery);