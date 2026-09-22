(function($) {
	function fx_collapse_menu() {
		var ParentMenuItem = $('.et_mobile_menu .menu-item-has-children > a');
		ParentMenuItem.off('click').click(function() {
			$(this).attr('href', '#');  
			$(this).parent().children().children().toggleClass('fx-show-menu-items');
			$(this).toggleClass('fx-menu-switched-icon');
		});
	}

	$(window).load(function() {
		setTimeout(function() {
			fx_collapse_menu();
		}, 700);
	});

})(jQuery);