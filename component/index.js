(function ($) {
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

            // Attach instance to both the wrapper group and the original element
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

            // initial sync and on changes
            updateMirror();
            $group.on('change.acmirror', 'input[type="radio"]', updateMirror);

            // expose for internal use
            instance.updateMirror = updateMirror;
            $newInput.on('change input', function () {
                var v = $(this).val();
                instance.methods.setValue.call(instance, v);
            });

            // output the value to input when call base input type="radio"
            $group.on('change', 'input[type="radio"]', function () {
                var v = $(this).val();
                $newInput.val(v);
            });

            

        });
    };
})(jQuery);