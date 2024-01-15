<!-- This page handles any error encountered by the site. -->
<script>
import { page } from '$app/stores'
</script>

<h2>{$page.status}</h2>
<p class="subhead">{$page.error.message}</p>

<p><strong>Maaf!</strong> Coba kembali ke <a href="/">laman awal</a></p>