<template>
    <span class="help-tip">
        <p>{{ content }}</p>
    </span>
</template>

<script setup lang="ts" name="HelpTip">
import { computed } from 'vue'

const props = defineProps<{text:string}>()
const content = computed(()=>{
	return props.text.replace(/\n/g, '<br/>')
})
</script>

<style scoped>
/* https://tutorialzine.com/2014/07/css-inline-help-tips */
.help-tip{
	display: inline-block;
	width: 1em;
	height: 1em;
	border-radius: 50%;
	text-align: center;
	background-color: #6dbae0;
	cursor: help;
}

.help-tip:before{
	content:'?';
	font-weight: bold;
	color: white;
}

.help-tip:hover p{
	display:inline-block;
	transform-origin: 100% 0%;
}

.help-tip p{
	display: none;
	text-align: left;
	background-color: #000000ab;
	padding: 0.5em;
	position: absolute;
	margin: 1em 2em 0 2em;
	left: 0;
	border-radius: 0.5em;
	color: white;
}
</style>