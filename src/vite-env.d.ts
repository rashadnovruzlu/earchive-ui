/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_API_BASE_URL?: string;
	readonly VITE_DWT_PRODUCT_KEY?: string;
	readonly VITE_DWT_RESOURCES_PATH?: string;
	readonly VITE_DWT_SERVICE_INSTALLER_LOCATION?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}