<!-- https://svelte.dev/repl/907ec85fe1554e2c964ba8227df60130?version=4.2.1 -->

<script>
    import * as Plot from '@observablehq/plot';
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

    export let options;

    export let fixedWidth = false;

    let width = 600;

    $: hash = JSON.stringify({ ...options, width });

    let plot;

    function myplot(node) {
        node.removeChild(node.children[0]);
        plot = Plot.plot({ ...options, ...(fixedWidth ? {} : { width }) });
        node.appendChild(plot);
        plot.addEventListener('click', (e) => {
            dispatch('click', { origEvent: e, value: plot.value });
        });
    }
</script>

{#key hash}
    <div class="plot" style="">
        <div bind:clientWidth={width} use:myplot {...$$restProps} />
        {#if $$slots.default}
            <div style="position: absolute;left:0;top:0"><slot {plot} /></div>
        {/if}
    </div>
    <slot name="below" {plot} />
{/key}

<style>
	.plot { position: relative; }
	.plot :global(h2) { font-size: 1.2rem;  }
	.plot :global(h3) { font-weight: normal; margin-top: 0; font-size: 0.9rem; }
    .plot :global(svg) {
		background: transparent!important;
	}
</style>
