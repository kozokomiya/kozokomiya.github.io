<?php

echo <<< EOM
<script src="./key.js"></script>
<script src="./config.js"></script>
EOM;


if (isset($_GET["type"]) && strcmp(strtolower($_GET["type"]), "vr") == 0) {
  require("../main/vrroom.html");
} else {
  require("../main/pcroom.html");
}

?>
