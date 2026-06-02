<template>
	<teleport to="body">
		<transition name="error-dialog-fade">
			<div
				v-if="props.open"
				class="error-dialog"
				role="alertdialog"
				aria-modal="true"
				aria-labelledby="error-dialog-title"
				aria-describedby="error-dialog-message">
				<div class="error-dialog-overlay" @click="onClose" />

				<transition name="error-dialog-slide" appear>
					<VCard v-if="props.open" class="error-dialog-card" @click.stop>
						<div id="error-dialog-title" class="v-card-title type-label error-dialog-title">
							Unexpected Error
						</div>

						<div id="error-dialog-message" class="error-dialog-message">
							{{ props.message }}
						</div>

						<div class="v-card-actions error-dialog-actions">
							<VButton @click="onClose">Close</VButton>
						</div>
					</VCard>
				</transition>
			</div>
		</transition>
	</teleport>
</template>

<script lang="ts" setup>
import { onBeforeUnmount, watch } from 'vue';

const props = defineProps<{
	open: boolean;
	message: string;
}>();

const emit = defineEmits<{
	(e: 'update:open', value: boolean): void;
}>();

function onClose() {
	emit('update:open', false);
}

function onKeydown(event: KeyboardEvent) {
	if (event.key === 'Escape') onClose();
}

watch(
	() => props.open,
	(isOpen) => {
		if (isOpen) window.addEventListener('keydown', onKeydown);
		else window.removeEventListener('keydown', onKeydown);
	},
	{ immediate: true }
);

onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown));
</script>

<style scoped>
.error-dialog {
	position: fixed;
	inset: 0;
	z-index: 10000;
	display: grid;
	place-items: center;
}

.error-dialog-overlay {
	position: absolute;
	inset: 0;
	background-color: var(--overlay-color);
}

.error-dialog-card {
	position: relative;
	min-width: 520px;
	max-width: min(92vw, 620px);
	padding: 16px;
	background-color: var(--theme--background);
	box-shadow: 0 4px 12px #2632381a;
}

.error-dialog-title {
	margin: 0;
	padding: 0;
	margin-bottom: 12px;
	font-size: 16px;
}

.error-dialog-message {
	font-family: var(--theme--fonts--monospace--font-family);
	font-size: 16px;
	color: var(--theme--danger);
	background: color-mix(in srgb, var(--theme--danger) 12%, var(--theme--background));
	padding: 12px 14px;
	margin-bottom: 12px;
	border-radius: 8px;
	line-height: 1.5;
}

.error-dialog-actions {
	display: flex;
	justify-content: flex-end;
	padding: 0;
}

.error-dialog-fade-enter-active,
.error-dialog-fade-leave-active {
	transition: opacity 160ms ease;
}

.error-dialog-fade-enter-from,
.error-dialog-fade-leave-to {
	opacity: 0;
}

.error-dialog-slide-enter-active,
.error-dialog-slide-leave-active {
	transition: transform 180ms ease, opacity 180ms ease;
}

.error-dialog-slide-enter-from,
.error-dialog-slide-leave-to {
	transform: translateY(36px);
	opacity: 0;
}
</style>
