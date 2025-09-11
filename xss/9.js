(function() {
    try {
        (alert)(1);
    } catch (e) {
        try {
            alert(2);
        } catch (e) {
            try {
                al\u0065rt(3);
            } catch (e) {
                console.log('None of the payloads triggered');
            }
        }
    }
})();
