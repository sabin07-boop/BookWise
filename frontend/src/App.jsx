import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import "./support-admin.css";

const API_URL = "http://localhost:5000";
const BTC_ADDRESS = "1BkDzTihKuYfDvUxQU9NAx8ZEn7Kw3DR3i";
const USDT_ADDRESS = "UQBxru5dszXQc-ZE1CmEHGM04yoJsOl8upycGc46SaryEDg5";
const BANK_QR_SRC = "/bank-transfer-qr.png";
const BTC_QR_SRC = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0nMS4wJyBlbmNvZGluZz0nVVRGLTgnPz4KPHN2ZyB3aWR0aD0iMTYuNW1tIiBoZWlnaHQ9IjE2LjVtbSIgdmVyc2lvbj0iMS4xIiB2aWV3Qm94PSIwIDAgMTYuNSAxNi41IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0xLDFIMS41VjEuNUgxek0xLjUsMUgyVjEuNUgxLjV6TTIsMUgyLjVWMS41SDJ6TTIuNSwxSDNWMS41SDIuNXpNMywxSDMuNVYxLjVIM3pNMy41LDFINFYxLjVIMy41ek00LDFINC41VjEuNUg0ek01LjUsMUg2VjEuNUg1LjV6TTYuNSwxSDdWMS41SDYuNXpNNywxSDcuNVYxLjVIN3pNOC41LDFIOVYxLjVIOC41ek0xMiwxSDEyLjVWMS41SDEyek0xMi41LDFIMTNWMS41SDEyLjV6TTEzLDFIMTMuNVYxLjVIMTN6TTEzLjUsMUgxNFYxLjVIMTMuNXpNMTQsMUgxNC41VjEuNUgxNHpNMTQuNSwxSDE1VjEuNUgxNC41ek0xNSwxSDE1LjVWMS41SDE1ek0xLDEuNUgxLjVWMkgxek00LDEuNUg0LjVWMkg0ek01LjUsMS41SDZWMkg1LjV6TTYsMS41SDYuNVYySDZ6TTcsMS41SDcuNVYySDd6TTcuNSwxLjVIOFYySDcuNXpNOCwxLjVIOC41VjJIOHpNOC41LDEuNUg5VjJIOC41ek05LjUsMS41SDEwVjJIOS41ek0xMCwxLjVIMTAuNVYySDEwek0xMiwxLjVIMTIuNVYySDEyek0xNSwxLjVIMTUuNVYySDE1ek0xLDJIMS41VjIuNUgxek0yLDJIMi41VjIuNUgyek0yLjUsMkgzVjIuNUgyLjV6TTMsMkgzLjVWMi41SDN6TTQsMkg0LjVWMi41SDR6TTUuNSwySDZWMi41SDUuNXpNNiwySDYuNVYyLjVINnpNOCwySDguNVYyLjVIOHpNOC41LDJIOVYyLjVIOC41ek05LDJIOS41VjIuNUg5ek05LjUsMkgxMFYyLjVIOS41ek0xMC41LDJIMTFWMi41SDEwLjV6TTExLDJIMTEuNVYyLjVIMTF6TTEyLDJIMTIuNVYyLjVIMTJ6TTEzLDJIMTMuNVYyLjVIMTN6TTEzLjUsMkgxNFYyLjVIMTMuNXpNMTQsMkgxNC41VjIuNUgxNHpNMTUsMkgxNS41VjIuNUgxNXpNMSwyLjVIMS41VjNIMXpNMiwyLjVIMi41VjNIMnpNMi41LDIuNUgzVjNIMi41ek0zLDIuNUgzLjVWM0gzek00LDIuNUg0LjVWM0g0ek01LjUsMi41SDZWM0g1LjV6TTYsMi41SDYuNVYzSDZ6TTYuNSwyLjVIN1YzSDYuNXpNNywyLjVINy41VjNIN3pNMTAsMi41SDEwLjVWM0gxMHpNMTAuNSwyLjVIMTFWM0gxMC41ek0xMSwyLjVIMTEuNVYzSDExek0xMiwyLjVIMTIuNVYzSDEyek0xMywyLjVIMTMuNVYzSDEzek0xMy41LDIuNUgxNFYzSDEzLjV6TTE0LDIuNUgxNC41VjNIMTR6TTE1LDIuNUgxNS41VjNIMTV6TTEsM0gxLjVWMy41SDF6TTIsM0gyLjVWMy41SDJ6TTIuNSwzSDNWMy41SDIuNXpNMywzSDMuNVYzLjVIM3pNNCwzSDQuNVYzLjVINHpNNS41LDNINlYzLjVINS41ek03LDNINy41VjMuNUg3ek03LjUsM0g4VjMuNUg3LjV6TTksM0g5LjVWMy41SDl6TTkuNSwzSDEwVjMuNUg5LjV6TTEyLDNIMTIuNVYzLjVIMTJ6TTEzLDNIMTMuNVYzLjVIMTN6TTEzLjUsM0gxNFYzLjVIMTMuNXpNMTQsM0gxNC41VjMuNUgxNHpNMTUsM0gxNS41VjMuNUgxNXpNMSwzLjVIMS41VjRIMXpNNCwzLjVINC41VjRINHpNNSwzLjVINS41VjRINXpNNi41LDMuNUg3VjRINi41ek04LDMuNUg4LjVWNEg4ek04LjUsMy41SDlWNEg4LjV6TTksMy41SDkuNVY0SDl6TTEwLjUsMy41SDExVjRIMTAuNXpNMTEsMy41SDExLjVWNEgxMXpNMTIsMy41SDEyLjVWNEgxMnpNMTUsMy41SDE1LjVWNEgxNXpNMSw0SDEuNVY0LjVIMXpNMS41LDRIMlY0LjVIMS41ek0yLDRIMi41VjQuNUgyek0yLjUsNEgzVjQuNUgyLjV6TTMsNEgzLjVWNC41SDN6TTMuNSw0SDRWNC41SDMuNXpNNCw0SDQuNVY0LjVINHpNNSw0SDUuNVY0LjVINXpNNiw0SDYuNVY0LjVINnpNNyw0SDcuNVY0LjVIN3pNOCw0SDguNVY0LjVIOHpNOSw0SDkuNVY0LjVIOXpNMTAsNEgxMC41VjQuNUgxMHpNMTEsNEgxMS41VjQuNUgxMXpNMTIsNEgxMi41VjQuNUgxMnpNMTIuNSw0SDEzVjQuNUgxMi41ek0xMyw0SDEzLjVWNC41SDEzek0xMy41LDRIMTRWNC41SDEzLjV6TTE0LDRIMTQuNVY0LjVIMTR6TTE0LjUsNEgxNVY0LjVIMTQuNXpNMTUsNEgxNS41VjQuNUgxNXpNNiw0LjVINi41VjVINnpNOCw0LjVIOC41VjVIOHpNOS41LDQuNUgxMFY1SDkuNXpNMTEsNC41SDExLjVWNUgxMXpNMSw1SDEuNVY1LjVIMXpNMi41LDVIM1Y1LjVIMi41ek0zLjUsNUg0VjUuNUgzLjV6TTQsNUg0LjVWNS41SDR6TTUsNUg1LjVWNS41SDV6TTcsNUg3LjVWNS41SDd6TTgsNUg4LjVWNS41SDh6TTkuNSw1SDEwVjUuNUg5LjV6TTExLjUsNUgxMlY1LjVIMTEuNXpNMTIuNSw1SDEzVjUuNUgxMi41ek0yLjUsNS41SDNWNkgyLjV6TTMsNS41SDMuNVY2SDN6TTUuNSw1LjVINlY2SDUuNXpNNiw1LjVINi41VjZINnpNNy41LDUuNUg4VjZINy41ek05LjUsNS41SDEwVjZIOS41ek0xMCw1LjVIMTAuNVY2SDEwek0xMC41LDUuNUgxMVY2SDEwLjV6TTExLDUuNUgxMS41VjZIMTF6TTEyLDUuNUgxMi41VjZIMTJ6TTEzLjUsNS41SDE0VjZIMTMuNXpNMTQuNSw1LjVIMTVWNkgxNC41ek0xNSw1LjVIMTUuNVY2SDE1ek0yLDZIMi41VjYuNUgyek0zLDZIMy41VjYuNUgzek00LDZINC41VjYuNUg0ek00LjUsNkg1VjYuNUg0LjV6TTUuNSw2SDZWNi41SDUuNXpNNi41LDZIN1Y2LjVINi41ek03LDZINy41VjYuNUg3ek03LjUsNkg4VjYuNUg3LjV6TTEwLDZIMTAuNVY2LjVIMTB6TTEwLjUsNkgxMVY2LjVIMTAuNXpNMTEsNkgxMS41VjYuNUgxMXpNMTIsNkgxMi41VjYuNUgxMnpNMTMsNkgxMy41VjYuNUgxM3pNMTQuNSw2SDE1VjYuNUgxNC41ek0xLDYuNUgxLjVWN0gxek0xLjUsNi41SDJWN0gxLjV6TTIsNi41SDIuNVY3SDJ6TTIuNSw2LjVIM1Y3SDIuNXpNMy41LDYuNUg0VjdIMy41ek02LDYuNUg2LjVWN0g2ek03LjUsNi41SDhWN0g3LjV6TTgsNi41SDguNVY3SDh6TTksNi41SDkuNVY3SDl6TTEwLDYuNUgxMC41VjdIMTB6TTExLjUsNi41SDEyVjdIMTEuNXpNMTIsNi41SDEyLjVWN0gxMnpNMTIuNSw2LjVIMTNWN0gxMi41ek0xNCw2LjVIMTQuNVY3SDE0ek0xNC41LDYuNUgxNVY3SDE0LjV6TTEsN0gxLjVWNy41SDF6TTEuNSw3SDJWNy41SDEuNXpNMiw3SDIuNVY3LjVIMnpNMi41LDdIM1Y3LjVIMi41ek00LDdINC41VjcuNUg0ek00LjUsN0g1VjcuNUg0LjV6TTYsN0g2LjVWNy41SDZ6TTcsN0g3LjVWNy41SDd6TTguNSw3SDlWNy41SDguNXpNOSw3SDkuNVY3LjVIOXpNMTEsN0gxMS41VjcuNUgxMXpNMTEuNSw3SDEyVjcuNUgxMS41ek0xMiw3SDEyLjVWNy41SDEyek0xMyw3SDEzLjVWNy41SDEzek0xNC41LDdIMTVWNy41SDE0LjV6TTE1LDdIMTUuNVY3LjVIMTV6TTEsNy41SDEuNVY4SDF6TTIsNy41SDIuNVY4SDJ6TTIuNSw3LjVIM1Y4SDIuNXpNMy41LDcuNUg0VjhIMy41ek01LDcuNUg1LjVWOEg1ek01LjUsNy41SDZWOEg1LjV6TTgsNy41SDguNVY4SDh6TTkuNSw3LjVIMTBWOEg5LjV6TTEwLDcuNUgxMC41VjhIMTB6TTEwLjUsNy41SDExVjhIMTAuNXpNMTEsNy41SDExLjVWOEgxMXpNMTIsNy41SDEyLjVWOEgxMnpNMTMuNSw3LjVIMTRWOEgxMy41ek0xNCw3LjVIMTQuNVY4SDE0ek0xLDhIMS41VjguNUgxek0yLjUsOEgzVjguNUgyLjV6TTMsOEgzLjVWOC41SDN6TTQsOEg0LjVWOC41SDR6TTUsOEg1LjVWOC41SDV6TTcsOEg3LjVWOC41SDd6TTcuNSw4SDhWOC41SDcuNXpNOS41LDhIMTBWOC41SDkuNXpNMTEsOEgxMS41VjguNUgxMXpNMTEuNSw4SDEyVjguNUgxMS41ek0xMiw4SDEyLjVWOC41SDEyek0xMy41LDhIMTRWOC41SDEzLjV6TTE0LDhIMTQuNVY4LjVIMTR6TTE0LjUsOEgxNVY4LjVIMTQuNXpNMTUsOEgxNS41VjguNUgxNXpNMS41LDguNUgyVjlIMS41ek0yLDguNUgyLjVWOUgyek02LDguNUg2LjVWOUg2ek02LjUsOC41SDdWOUg2LjV6TTcuNSw4LjVIOFY5SDcuNXpNOC41LDguNUg5VjlIOC41ek05LDguNUg5LjVWOUg5ek05LjUsOC41SDEwVjlIOS41ek0xMCw4LjVIMTAuNVY5SDEwek0xMC41LDguNUgxMVY5SDEwLjV6TTExLjUsOC41SDEyVjlIMTEuNXpNMTIuNSw4LjVIMTNWOUgxMi41ek0xMyw4LjVIMTMuNVY5SDEzek0yLDlIMi41VjkuNUgyek0yLjUsOUgzVjkuNUgyLjV6TTMsOUgzLjVWOS41SDN6TTQsOUg0LjVWOS41SDR6TTUsOUg1LjVWOS41SDV6TTUuNSw5SDZWOS41SDUuNXpNNiw5SDYuNVY5LjVINnpNNyw5SDcuNVY5LjVIN3pNOCw5SDguNVY5LjVIOHpNOS41LDlIMTBWOS41SDkuNXpNMTAsOUgxMC41VjkuNUgxMHpNMTEuNSw5SDEyVjkuNUgxMS41ek0xMy41LDlIMTRWOS41SDEzLjV6TTE1LDlIMTUuNVY5LjVIMTV6TTEuNSw5LjVIMlYxMEgxLjV6TTIsOS41SDIuNVYxMEgyek0zLjUsOS41SDRWMTBIMy41ek00LjUsOS41SDVWMTBINC41ek02LDkuNUg2LjVWMTBINnpNNy41LDkuNUg4VjEwSDcuNXpNOC41LDkuNUg5VjEwSDguNXpNOSw5LjVIOS41VjEwSDl6TTkuNSw5LjVIMTBWMTBIOS41ek0xMCw5LjVIMTAuNVYxMEgxMHpNMTAuNSw5LjVIMTFWMTBIMTAuNXpNMTEuNSw5LjVIMTJWMTBIMTEuNXpNMTIsOS41SDEyLjVWMTBIMTJ6TTEyLjUsOS41SDEzVjEwSDEyLjV6TTEzLjUsOS41SDE0VjEwSDEzLjV6TTE0LjUsOS41SDE1VjEwSDE0LjV6TTE1LDkuNUgxNS41VjEwSDE1ek0xLDEwSDEuNVYxMC41SDF6TTIsMTBIMi41VjEwLjVIMnpNMywxMEgzLjVWMTAuNUgzek0zLjUsMTBINFYxMC41SDMuNXpNNCwxMEg0LjVWMTAuNUg0ek00LjUsMTBINVYxMC41SDQuNXpNNSwxMEg1LjVWMTAuNUg1ek01LjUsMTBINlYxMC41SDUuNXpNNiwxMEg2LjVWMTAuNUg2ek02LjUsMTBIN1YxMC41SDYuNXpNNywxMEg3LjVWMTAuNUg3ek03LjUsMTBIOFYxMC41SDcuNXpNOCwxMEg4LjVWMTAuNUg4ek05LDEwSDkuNVYxMC41SDl6TTEwLDEwSDEwLjVWMTAuNUgxMHpNMTMuNSwxMEgxNFYxMC41SDEzLjV6TTE0LDEwSDE0LjVWMTAuNUgxNHpNMTQuNSwxMEgxNVYxMC41SDE0LjV6TTE1LDEwSDE1LjVWMTAuNUgxNXpNMywxMC41SDMuNVYxMUgzek0zLjUsMTAuNUg0VjExSDMuNXpNNS41LDEwLjVINlYxMUg1LjV6TTYuNSwxMC41SDdWMTFINi41ek04LDEwLjVIOC41VjExSDh6TTksMTAuNUg5LjVWMTFIOXpNOS41LDEwLjVIMTBWMTFIOS41ek0xMCwxMC41SDEwLjVWMTFIMTB6TTExLDEwLjVIMTEuNVYxMUgxMXpNMTIsMTAuNUgxMi41VjExSDEyek0xMi41LDEwLjVIMTNWMTFIMTIuNXpNMTMuNSwxMC41SDE0VjExSDEzLjV6TTE0LjUsMTAuNUgxNVYxMUgxNC41ek0xLDExSDEuNVYxMS41SDF6TTIuNSwxMUgzVjExLjVIMi41ek0zLDExSDMuNVYxMS41SDN6TTMuNSwxMUg0VjExLjVIMy41ek00LDExSDQuNVYxMS41SDR6TTUsMTFINS41VjExLjVINXpNNS41LDExSDZWMTEuNUg1LjV6TTcsMTFINy41VjExLjVIN3pNNy41LDExSDhWMTEuNUg3LjV6TTgsMTFIOC41VjExLjVIOHpNOC41LDExSDlWMTEuNUg4LjV6TTkuNSwxMUgxMFYxMS41SDkuNXpNMTEsMTFIMTEuNVYxMS41SDExek0xMS41LDExSDEyVjExLjVIMTEuNXpNMTIsMTFIMTIuNVYxMS41SDEyek0xMi41LDExSDEzVjExLjVIMTIuNXpNMTMsMTFIMTMuNVYxMS41SDEzek0xNCwxMUgxNC41VjExLjVIMTR6TTE1LDExSDE1LjVWMTEuNUgxNXpNNSwxMS41SDUuNVYxMkg1ek01LjUsMTEuNUg2VjEySDUuNXpNOC41LDExLjVIOVYxMkg4LjV6TTksMTEuNUg5LjVWMTJIOXpNMTEsMTEuNUgxMS41VjEySDExek0xMywxMS41SDEzLjVWMTJIMTN6TTE0LDExLjVIMTQuNVYxMkgxNHpNMTQuNSwxMS41SDE1VjEySDE0LjV6TTE1LDExLjVIMTUuNVYxMkgxNXpNMSwxMkgxLjVWMTIuNUgxek0xLjUsMTJIMlYxMi41SDEuNXpNMiwxMkgyLjVWMTIuNUgyek0yLjUsMTJIM1YxMi41SDIuNXpNMywxMkgzLjVWMTIuNUgzek0zLjUsMTJINFYxMi41SDMuNXpNNCwxMkg0LjVWMTIuNUg0ek01LjUsMTJINlYxMi41SDUuNXpNNiwxMkg2LjVWMTIuNUg2ek02LjUsMTJIN1YxMi41SDYuNXpNNy41LDEySDhWMTIuNUg3LjV6TTgsMTJIOC41VjEyLjVIOHpNOS41LDEySDEwVjEyLjVIOS41ek0xMSwxMkgxMS41VjEyLjVIMTF6TTEyLDEySDEyLjVWMTIuNUgxMnpNMTMsMTJIMTMuNVYxMi41SDEzek0xMy41LDEySDE0VjEyLjVIMTMuNXpNMTQuNSwxMkgxNVYxMi41SDE0LjV6TTEsMTIuNUgxLjVWMTNIMXpNNCwxMi41SDQuNVYxM0g0ek01LDEyLjVINS41VjEzSDV6TTUuNSwxMi41SDZWMTNINS41ek02LDEyLjVINi41VjEzSDZ6TTcuNSwxMi41SDhWMTNINy41ek04LjUsMTIuNUg5VjEzSDguNXpNMTEsMTIuNUgxMS41VjEzSDExek0xMywxMi41SDEzLjVWMTNIMTN6TTEzLjUsMTIuNUgxNFYxM0gxMy41ek0xNCwxMi41SDE0LjVWMTNIMTR6TTE0LjUsMTIuNUgxNVYxM0gxNC41ek0xNSwxMi41SDE1LjVWMTNIMTV6TTEsMTNIMS41VjEzLjVIMXpNMiwxM0gyLjVWMTMuNUgyek0yLjUsMTNIM1YxMy41SDIuNXpNMywxM0gzLjVWMTMuNUgzek00LDEzSDQuNVYxMy41SDR6TTYuNSwxM0g3VjEzLjVINi41ek03LDEzSDcuNVYxMy41SDd6TTgsMTNIOC41VjEzLjVIOHpNOC41LDEzSDlWMTMuNUg4LjV6TTExLDEzSDExLjVWMTMuNUgxMXpNMTEuNSwxM0gxMlYxMy41SDExLjV6TTEyLDEzSDEyLjVWMTMuNUgxMnpNMTIuNSwxM0gxM1YxMy41SDEyLjV6TTEzLDEzSDEzLjVWMTMuNUgxM3pNMTMuNSwxM0gxNFYxMy41SDEzLjV6TTEsMTMuNUgxLjVWMTRIMXpNMiwxMy41SDIuNVYxNEgyek0yLjUsMTMuNUgzVjE0SDIuNXpNMywxMy41SDMuNVYxNEgzek00LDEzLjVINC41VjE0SDR6TTUsMTMuNUg1LjVWMTRINXpNNS41LDEzLjVINlYxNEg1LjV6TTYsMTMuNUg2LjVWMTRINnpNNywxMy41SDcuNVYxNEg3ek05LDEzLjVIOS41VjE0SDl6TTkuNSwxMy41SDEwVjE0SDkuNXpNMTAuNSwxMy41SDExVjE0SDEwLjV6TTExLDEzLjVIMTEuNVYxNEgxMXpNMTIsMTMuNUgxMi41VjE0SDEyek0xMi41LDEzLjVIMTNWMTRIMTIuNXpNMTQsMTMuNUgxNC41VjE0SDE0ek0xNC41LDEzLjVIMTVWMTRIMTQuNXpNMSwxNEgxLjVWMTQuNUgxek0yLDE0SDIuNVYxNC41SDJ6TTIuNSwxNEgzVjE0LjVIMi41ek0zLDE0SDMuNVYxNC41SDN6TTQsMTRINC41VjE0LjVINHpNNi41LDE0SDdWMTQuNUg2LjV6TTksMTRIOS41VjE0LjVIOXpNOS41LDE0SDEwVjE0LjVIOS41ek0xMCwxNEgxMC41VjE0LjVIMTB6TTExLDE0SDExLjVWMTQuNUgxMXpNMTMsMTRIMTMuNVYxNC41SDEzek0xNCwxNEgxNC41VjE0LjVIMTR6TTE1LDE0SDE1LjVWMTQuNUgxNXpNMSwxNC41SDEuNVYxNUgxek00LDE0LjVINC41VjE1SDR6TTYuNSwxNC41SDdWMTVINi41ek04LjUsMTQuNUg5VjE1SDguNXpNOS41LDE0LjVIMTBWMTVIOS41ek0xMCwxNC41SDEwLjVWMTVIMTB6TTEwLjUsMTQuNUgxMVYxNUgxMC41ek0xMS41LDE0LjVIMTJWMTVIMTEuNXpNMTIsMTQuNUgxMi41VjE1SDEyek0xMy41LDE0LjVIMTRWMTVIMTMuNXpNMTQuNSwxNC41SDE1VjE1SDE0LjV6TTEsMTVIMS41VjE1LjVIMXpNMS41LDE1SDJWMTUuNUgxLjV6TTIsMTVIMi41VjE1LjVIMnpNMi41LDE1SDNWMTUuNUgyLjV6TTMsMTVIMy41VjE1LjVIM3pNMy41LDE1SDRWMTUuNUgzLjV6TTQsMTVINC41VjE1LjVINHpNNSwxNUg1LjVWMTUuNUg1ek03LDE1SDcuNVYxNS41SDd6TTgsMTVIOC41VjE1LjVIOHpNOC41LDE1SDlWMTUuNUg4LjV6TTksMTVIOS41VjE1LjVIOXpNOS41LDE1SDEwVjE1LjVIOS41ek0xMSwxNUgxMS41VjE1LjVIMTF6TTEzLDE1SDEzLjVWMTUuNUgxM3pNMTQuNSwxNUgxNVYxNS41SDE0LjV6IiBpZD0icXItcGF0aCIgZmlsbD0iIzAwMDAwMCIgZmlsbC1vcGFjaXR5PSIxIiBmaWxsLXJ1bGU9Im5vbnplcm8iIHN0cm9rZT0ibm9uZSIvPjwvc3ZnPg==";
const USDT_QR_SRC = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0nMS4wJyBlbmNvZGluZz0nVVRGLTgnPz4KPHN2ZyB3aWR0aD0iMTguNW1tIiBoZWlnaHQ9IjE4LjVtbSIgdmVyc2lvbj0iMS4xIiB2aWV3Qm94PSIwIDAgMTguNSAxOC41IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0xLDFIMS41VjEuNUgxek0xLjUsMUgyVjEuNUgxLjV6TTIsMUgyLjVWMS41SDJ6TTIuNSwxSDNWMS41SDIuNXpNMywxSDMuNVYxLjVIM3pNMy41LDFINFYxLjVIMy41ek00LDFINC41VjEuNUg0ek01LDFINS41VjEuNUg1ek02LDFINi41VjEuNUg2ek04LDFIOC41VjEuNUg4ek04LjUsMUg5VjEuNUg4LjV6TTEwLDFIMTAuNVYxLjVIMTB6TTEwLjUsMUgxMVYxLjVIMTAuNXpNMTEuNSwxSDEyVjEuNUgxMS41ek0xMiwxSDEyLjVWMS41SDEyek0xMywxSDEzLjVWMS41SDEzek0xNCwxSDE0LjVWMS41SDE0ek0xNC41LDFIMTVWMS41SDE0LjV6TTE1LDFIMTUuNVYxLjVIMTV6TTE1LjUsMUgxNlYxLjVIMTUuNXpNMTYsMUgxNi41VjEuNUgxNnpNMTYuNSwxSDE3VjEuNUgxNi41ek0xNywxSDE3LjVWMS41SDE3ek0xLDEuNUgxLjVWMkgxek00LDEuNUg0LjVWMkg0ek01LDEuNUg1LjVWMkg1ek02LjUsMS41SDdWMkg2LjV6TTcsMS41SDcuNVYySDd6TTksMS41SDkuNVYySDl6TTkuNSwxLjVIMTBWMkg5LjV6TTEwLjUsMS41SDExVjJIMTAuNXpNMTEsMS41SDExLjVWMkgxMXpNMTIsMS41SDEyLjVWMkgxMnpNMTQsMS41SDE0LjVWMkgxNHpNMTcsMS41SDE3LjVWMkgxN3pNMSwySDEuNVYyLjVIMXpNMiwySDIuNVYyLjVIMnpNMi41LDJIM1YyLjVIMi41ek0zLDJIMy41VjIuNUgzek00LDJINC41VjIuNUg0ek01LDJINS41VjIuNUg1ek02LDJINi41VjIuNUg2ek02LjUsMkg3VjIuNUg2LjV6TTcsMkg3LjVWMi41SDd6TTksMkg5LjVWMi41SDl6TTkuNSwySDEwVjIuNUg5LjV6TTEwLDJIMTAuNVYyLjVIMTB6TTEwLjUsMkgxMVYyLjVIMTAuNXpNMTEuNSwySDEyVjIuNUgxMS41ek0xMi41LDJIMTNWMi41SDEyLjV6TTEzLDJIMTMuNVYyLjVIMTN6TTE0LDJIMTQuNVYyLjVIMTR6TTE1LDJIMTUuNVYyLjVIMTV6TTE1LjUsMkgxNlYyLjVIMTUuNXpNMTYsMkgxNi41VjIuNUgxNnpNMTcsMkgxNy41VjIuNUgxN3pNMSwyLjVIMS41VjNIMXpNMiwyLjVIMi41VjNIMnpNMi41LDIuNUgzVjNIMi41ek0zLDIuNUgzLjVWM0gzek00LDIuNUg0LjVWM0g0ek02LDIuNUg2LjVWM0g2ek0xMC41LDIuNUgxMVYzSDEwLjV6TTEzLDIuNUgxMy41VjNIMTN6TTE0LDIuNUgxNC41VjNIMTR6TTE1LDIuNUgxNS41VjNIMTV6TTE1LjUsMi41SDE2VjNIMTUuNXpNMTYsMi41SDE2LjVWM0gxNnpNMTcsMi41SDE3LjVWM0gxN3pNMSwzSDEuNVYzLjVIMXpNMiwzSDIuNVYzLjVIMnpNMi41LDNIM1YzLjVIMi41ek0zLDNIMy41VjMuNUgzek00LDNINC41VjMuNUg0ek01LDNINS41VjMuNUg1ek01LjUsM0g2VjMuNUg1LjV6TTYsM0g2LjVWMy41SDZ6TTcuNSwzSDhWMy41SDcuNXpNOCwzSDguNVYzLjVIOHpNOC41LDNIOVYzLjVIOC41ek05LjUsM0gxMFYzLjVIOS41ek0xMCwzSDEwLjVWMy41SDEwek0xMSwzSDExLjVWMy41SDExek0xMi41LDNIMTNWMy41SDEyLjV6TTE0LDNIMTQuNVYzLjVIMTR6TTE1LDNIMTUuNVYzLjVIMTV6TTE1LjUsM0gxNlYzLjVIMTUuNXpNMTYsM0gxNi41VjMuNUgxNnpNMTcsM0gxNy41VjMuNUgxN3pNMSwzLjVIMS41VjRIMXpNNCwzLjVINC41VjRINHpNNS41LDMuNUg2VjRINS41ek02LjUsMy41SDdWNEg2LjV6TTcsMy41SDcuNVY0SDd6TTcuNSwzLjVIOFY0SDcuNXpNOCwzLjVIOC41VjRIOHpNMTEsMy41SDExLjVWNEgxMXpNMTIuNSwzLjVIMTNWNEgxMi41ek0xNCwzLjVIMTQuNVY0SDE0ek0xNywzLjVIMTcuNVY0SDE3ek0xLDRIMS41VjQuNUgxek0xLjUsNEgyVjQuNUgxLjV6TTIsNEgyLjVWNC41SDJ6TTIuNSw0SDNWNC41SDIuNXpNMyw0SDMuNVY0LjVIM3pNMy41LDRINFY0LjVIMy41ek00LDRINC41VjQuNUg0ek01LDRINS41VjQuNUg1ek02LDRINi41VjQuNUg2ek03LDRINy41VjQuNUg3ek04LDRIOC41VjQuNUg4ek05LDRIOS41VjQuNUg5ek0xMCw0SDEwLjVWNC41SDEwek0xMSw0SDExLjVWNC41SDExek0xMiw0SDEyLjVWNC41SDEyek0xMyw0SDEzLjVWNC41SDEzek0xNCw0SDE0LjVWNC41SDE0ek0xNC41LDRIMTVWNC41SDE0LjV6TTE1LDRIMTUuNVY0LjVIMTV6TTE1LjUsNEgxNlY0LjVIMTUuNXpNMTYsNEgxNi41VjQuNUgxNnpNMTYuNSw0SDE3VjQuNUgxNi41ek0xNyw0SDE3LjVWNC41SDE3ek02LDQuNUg2LjVWNUg2ek03LjUsNC41SDhWNUg3LjV6TTEwLjUsNC41SDExVjVIMTAuNXpNMTEsNC41SDExLjVWNUgxMXpNMTIsNC41SDEyLjVWNUgxMnpNMTMsNC41SDEzLjVWNUgxM3pNMSw1SDEuNVY1LjVIMXpNMi41LDVIM1Y1LjVIMi41ek0zLDVIMy41VjUuNUgzek0zLjUsNUg0VjUuNUgzLjV6TTQsNUg0LjVWNS41SDR6TTQuNSw1SDVWNS41SDQuNXpNNSw1SDUuNVY1LjVINXpNNS41LDVINlY1LjVINS41ek04LDVIOC41VjUuNUg4ek04LjUsNUg5VjUuNUg4LjV6TTEwLjUsNUgxMVY1LjVIMTAuNXpNMTEuNSw1SDEyVjUuNUgxMS41ek0xMi41LDVIMTNWNS41SDEyLjV6TTEzLDVIMTMuNVY1LjVIMTN6TTEzLjUsNUgxNFY1LjVIMTMuNXpNMTUsNUgxNS41VjUuNUgxNXpNMTYsNUgxNi41VjUuNUgxNnpNMTYuNSw1SDE3VjUuNUgxNi41ek0xNyw1SDE3LjVWNS41SDE3ek0yLjUsNS41SDNWNkgyLjV6TTMsNS41SDMuNVY2SDN6TTMuNSw1LjVINFY2SDMuNXpNNC41LDUuNUg1VjZINC41ek01LjUsNS41SDZWNkg1LjV6TTYuNSw1LjVIN1Y2SDYuNXpNNyw1LjVINy41VjZIN3pNOCw1LjVIOC41VjZIOHpNOC41LDUuNUg5VjZIOC41ek0xMCw1LjVIMTAuNVY2SDEwek0xMi41LDUuNUgxM1Y2SDEyLjV6TTE0LjUsNS41SDE1VjZIMTQuNXpNMTUsNS41SDE1LjVWNkgxNXpNMTYsNS41SDE2LjVWNkgxNnpNMTYuNSw1LjVIMTdWNkgxNi41ek0xLDZIMS41VjYuNUgxek00LDZINC41VjYuNUg0ek01LjUsNkg2VjYuNUg1LjV6TTYuNSw2SDdWNi41SDYuNXpNNyw2SDcuNVY2LjVIN3pNOCw2SDguNVY2LjVIOHpNOC41LDZIOVY2LjVIOC41ek05LjUsNkgxMFY2LjVIOS41ek0xMCw2SDEwLjVWNi41SDEwek0xMS41LDZIMTJWNi41SDExLjV6TTEyLDZIMTIuNVY2LjVIMTJ6TTEyLjUsNkgxM1Y2LjVIMTIuNXpNMTMuNSw2SDE0VjYuNUgxMy41ek0xNCw2SDE0LjVWNi41SDE0ek0xNiw2SDE2LjVWNi41SDE2ek0xNi41LDZIMTdWNi41SDE2LjV6TTE3LDZIMTcuNVY2LjVIMTd6TTIsNi41SDIuNVY3SDJ6TTIuNSw2LjVIM1Y3SDIuNXpNNC41LDYuNUg1VjdINC41ek01LDYuNUg1LjVWN0g1ek02LDYuNUg2LjVWN0g2ek04LDYuNUg4LjVWN0g4ek04LjUsNi41SDlWN0g4LjV6TTksNi41SDkuNVY3SDl6TTkuNSw2LjVIMTBWN0g5LjV6TTExLDYuNUgxMS41VjdIMTF6TTEyLDYuNUgxMi41VjdIMTJ6TTEyLjUsNi41SDEzVjdIMTIuNXpNMTMsNi41SDEzLjVWN0gxM3pNMTQuNSw2LjVIMTVWN0gxNC41ek0xNSw2LjVIMTUuNVY3SDE1ek0xNiw2LjVIMTYuNVY3SDE2ek0xNi41LDYuNUgxN1Y3SDE2LjV6TTEuNSw3SDJWNy41SDEuNXpNMiw3SDIuNVY3LjVIMnpNMi41LDdIM1Y3LjVIMi41ek0zLDdIMy41VjcuNUgzek0zLjUsN0g0VjcuNUgzLjV6TTQsN0g0LjVWNy41SDR6TTQuNSw3SDVWNy41SDQuNXpNNiw3SDYuNVY3LjVINnpNNi41LDdIN1Y3LjVINi41ek03LjUsN0g4VjcuNUg3LjV6TTgsN0g4LjVWNy41SDh6TTksN0g5LjVWNy41SDl6TTkuNSw3SDEwVjcuNUg5LjV6TTEwLDdIMTAuNVY3LjVIMTB6TTEwLjUsN0gxMVY3LjVIMTAuNXpNMTEsN0gxMS41VjcuNUgxMXpNMTIuNSw3SDEzVjcuNUgxMi41ek0xMy41LDdIMTRWNy41SDEzLjV6TTE0LDdIMTQuNVY3LjVIMTR6TTE1LjUsN0gxNlY3LjVIMTUuNXpNMTYsN0gxNi41VjcuNUgxNnpNMTcsN0gxNy41VjcuNUgxN3pNMSw3LjVIMS41VjhIMXpNMS41LDcuNUgyVjhIMS41ek0yLjUsNy41SDNWOEgyLjV6TTMsNy41SDMuNVY4SDN6TTUsNy41SDUuNVY4SDV6TTUuNSw3LjVINlY4SDUuNXpNNi41LDcuNUg3VjhINi41ek03LjUsNy41SDhWOEg3LjV6TTksNy41SDkuNVY4SDl6TTkuNSw3LjVIMTBWOEg5LjV6TTEwLjUsNy41SDExVjhIMTAuNXpNMTEuNSw3LjVIMTJWOEgxMS41ek0xMi41LDcuNUgxM1Y4SDEyLjV6TTE2LDcuNUgxNi41VjhIMTZ6TTE3LDcuNUgxNy41VjhIMTd6TTIsOEgyLjVWOC41SDJ6TTIuNSw4SDNWOC41SDIuNXpNMyw4SDMuNVY4LjVIM3pNMy41LDhINFY4LjVIMy41ek00LDhINC41VjguNUg0ek00LjUsOEg1VjguNUg0LjV6TTYuNSw4SDdWOC41SDYuNXpNNyw4SDcuNVY4LjVIN3pNOCw4SDguNVY4LjVIOHpNOSw4SDkuNVY4LjVIOXpNMTIsOEgxMi41VjguNUgxMnpNMTMsOEgxMy41VjguNUgxM3pNMTYsOEgxNi41VjguNUgxNnpNMi41LDguNUgzVjlIMi41ek0zLDguNUgzLjVWOUgzek00LjUsOC41SDVWOUg0LjV6TTUsOC41SDUuNVY5SDV6TTcsOC41SDcuNVY5SDd6TTgsOC41SDguNVY5SDh6TTguNSw4LjVIOVY5SDguNXpNMTAuNSw4LjVIMTFWOUgxMC41ek0xMiw4LjVIMTIuNVY5SDEyek0xMi41LDguNUgxM1Y5SDEyLjV6TTEzLDguNUgxMy41VjlIMTN6TTE0LDguNUgxNC41VjlIMTR6TTE1LDguNUgxNS41VjlIMTV6TTE1LjUsOC41SDE2VjlIMTUuNXpNMTYsOC41SDE2LjVWOUgxNnpNMTYuNSw4LjVIMTdWOUgxNi41ek0xNyw4LjVIMTcuNVY5SDE3ek0yLDlIMi41VjkuNUgyek00LDlINC41VjkuNUg0ek00LjUsOUg1VjkuNUg0LjV6TTUsOUg1LjVWOS41SDV6TTUuNSw5SDZWOS41SDUuNXpNNy41LDlIOFY5LjVINy41ek04LDlIOC41VjkuNUg4ek0xMCw5SDEwLjVWOS41SDEwek0xMC41LDlIMTFWOS41SDEwLjV6TTExLDlIMTEuNVY5LjVIMTF6TTExLjUsOUgxMlY5LjVIMTEuNXpNMTIsOUgxMi41VjkuNUgxMnpNMTIuNSw5SDEzVjkuNUgxMi41ek0xMy41LDlIMTRWOS41SDEzLjV6TTE0LDlIMTQuNVY5LjVIMTR6TTE1LDlIMTUuNVY5LjVIMTV6TTE2LjUsOUgxN1Y5LjVIMTYuNXpNMTcsOUgxNy41VjkuNUgxN3pNMSw5LjVIMS41VjEwSDF6TTIuNSw5LjVIM1YxMEgyLjV6TTMsOS41SDMuNVYxMEgzek01LDkuNUg1LjVWMTBINXpNNi41LDkuNUg3VjEwSDYuNXpNNy41LDkuNUg4VjEwSDcuNXpNMTEsOS41SDExLjVWMTBIMTF6TTEyLDkuNUgxMi41VjEwSDEyek0xMi41LDkuNUgxM1YxMEgxMi41ek0xMy41LDkuNUgxNFYxMEgxMy41ek0xNCw5LjVIMTQuNVYxMEgxNHpNMTUsOS41SDE1LjVWMTBIMTV6TTE1LjUsOS41SDE2VjEwSDE1LjV6TTE2LDkuNUgxNi41VjEwSDE2ek0xNi41LDkuNUgxN1YxMEgxNi41ek0xNyw5LjVIMTcuNVYxMEgxN3pNMywxMEgzLjVWMTAuNUgzek00LDEwSDQuNVYxMC41SDR6TTQuNSwxMEg1VjEwLjVINC41ek01LDEwSDUuNVYxMC41SDV6TTgsMTBIOC41VjEwLjVIOHpNOC41LDEwSDlWMTAuNUg4LjV6TTEwLjUsMTBIMTFWMTAuNUgxMC41ek0xMi41LDEwSDEzVjEwLjVIMTIuNXpNMTMsMTBIMTMuNVYxMC41SDEzek0xNCwxMEgxNC41VjEwLjVIMTR6TTE1LDEwSDE1LjVWMTAuNUgxNXpNMTUuNSwxMEgxNlYxMC41SDE1LjV6TTE3LDEwSDE3LjVWMTAuNUgxN3pNMS41LDEwLjVIMlYxMUgxLjV6TTIsMTAuNUgyLjVWMTFIMnpNMi41LDEwLjVIM1YxMUgyLjV6TTMsMTAuNUgzLjVWMTFIM3pNNC41LDEwLjVINVYxMUg0LjV6TTYsMTAuNUg2LjVWMTFINnpNNi41LDEwLjVIN1YxMUg2LjV6TTcsMTAuNUg3LjVWMTFIN3pNOCwxMC41SDguNVYxMUg4ek04LjUsMTAuNUg5VjExSDguNXpNOSwxMC41SDkuNVYxMUg5ek05LjUsMTAuNUgxMFYxMUg5LjV6TTEwLDEwLjVIMTAuNVYxMUgxMHpNMTAuNSwxMC41SDExVjExSDEwLjV6TTEyLDEwLjVIMTIuNVYxMUgxMnpNMTMsMTAuNUgxMy41VjExSDEzek0xMy41LDEwLjVIMTRWMTFIMTMuNXpNMTQuNSwxMC41SDE1VjExSDE0LjV6TTE1LjUsMTAuNUgxNlYxMUgxNS41ek0xNiwxMC41SDE2LjVWMTFIMTZ6TTE2LjUsMTAuNUgxN1YxMUgxNi41ek0xNywxMC41SDE3LjVWMTFIMTd6TTEsMTFIMS41VjExLjVIMXpNMS41LDExSDJWMTEuNUgxLjV6TTIsMTFIMi41VjExLjVIMnpNMywxMUgzLjVWMTEuNUgzek0zLjUsMTFINFYxMS41SDMuNXpNNCwxMUg0LjVWMTEuNUg0ek00LjUsMTFINVYxMS41SDQuNXpNNSwxMUg1LjVWMTEuNUg1ek01LjUsMTFINlYxMS41SDUuNXpNNiwxMUg2LjVWMTEuNUg2ek03LDExSDcuNVYxMS41SDd6TTExLDExSDExLjVWMTEuNUgxMXpNMTIsMTFIMTIuNVYxMS41SDEyek0xMi41LDExSDEzVjExLjVIMTIuNXpNMTQuNSwxMUgxNVYxMS41SDE0LjV6TTE1LjUsMTFIMTZWMTEuNUgxNS41ek0xNi41LDExSDE3VjExLjVIMTYuNXpNMTcsMTFIMTcuNVYxMS41SDE3ek0xLDExLjVIMS41VjEySDF6TTEuNSwxMS41SDJWMTJIMS41ek0yLjUsMTEuNUgzVjEySDIuNXpNMy41LDExLjVINFYxMkgzLjV6TTUsMTEuNUg1LjVWMTJINXpNNy41LDExLjVIOFYxMkg3LjV6TTgsMTEuNUg4LjVWMTJIOHpNOSwxMS41SDkuNVYxMkg5ek0xMCwxMS41SDEwLjVWMTJIMTB6TTExLDExLjVIMTEuNVYxMkgxMXpNMTIuNSwxMS41SDEzVjEySDEyLjV6TTEzLjUsMTEuNUgxNFYxMkgxMy41ek0xNCwxMS41SDE0LjVWMTJIMTR6TTE0LjUsMTEuNUgxNVYxMkgxNC41ek0xNSwxMS41SDE1LjVWMTJIMTV6TTE2LjUsMTEuNUgxN1YxMkgxNi41ek0xNywxMS41SDE3LjVWMTJIMTd6TTEsMTJIMS41VjEyLjVIMXpNMiwxMkgyLjVWMTIuNUgyek0yLjUsMTJIM1YxMi41SDIuNXpNMy41LDEySDRWMTIuNUgzLjV6TTQsMTJINC41VjEyLjVINHpNNC41LDEySDVWMTIuNUg0LjV6TTUsMTJINS41VjEyLjVINXpNNS41LDEySDZWMTIuNUg1LjV6TTYsMTJINi41VjEyLjVINnpNNy41LDEySDhWMTIuNUg3LjV6TTguNSwxMkg5VjEyLjVIOC41ek05LDEySDkuNVYxMi41SDl6TTkuNSwxMkgxMFYxMi41SDkuNXpNMTAsMTJIMTAuNVYxMi41SDEwek0xMS41LDEySDEyVjEyLjVIMTEuNXpNMTIsMTJIMTIuNVYxMi41SDEyek0xMi41LDEySDEzVjEyLjVIMTIuNXpNMTQsMTJIMTQuNVYxMi41SDE0ek0xNSwxMkgxNS41VjEyLjVIMTV6TTE2LDEySDE2LjVWMTIuNUgxNnpNMTYuNSwxMkgxN1YxMi41SDE2LjV6TTE3LDEySDE3LjVWMTIuNUgxN3pNMSwxMi41SDEuNVYxM0gxek0zLDEyLjVIMy41VjEzSDN6TTMuNSwxMi41SDRWMTNIMy41ek01LDEyLjVINS41VjEzSDV6TTYuNSwxMi41SDdWMTNINi41ek03LjUsMTIuNUg4VjEzSDcuNXpNOCwxMi41SDguNVYxM0g4ek05LDEyLjVIOS41VjEzSDl6TTkuNSwxMi41SDEwVjEzSDkuNXpNMTAsMTIuNUgxMC41VjEzSDEwek0xMi41LDEyLjVIMTNWMTNIMTIuNXpNMTMsMTIuNUgxMy41VjEzSDEzek0xMy41LDEyLjVIMTRWMTNIMTMuNXpNMTQsMTIuNUgxNC41VjEzSDE0ek0xNC41LDEyLjVIMTVWMTNIMTQuNXpNMTUsMTIuNUgxNS41VjEzSDE1ek0xNiwxMi41SDE2LjVWMTNIMTZ6TTEsMTNIMS41VjEzLjVIMXpNMS41LDEzSDJWMTMuNUgxLjV6TTIsMTNIMi41VjEzLjVIMnpNMywxM0gzLjVWMTMuNUgzek00LDEzSDQuNVYxMy41SDR6TTQuNSwxM0g1VjEzLjVINC41ek01LDEzSDUuNVYxMy41SDV6TTUuNSwxM0g2VjEzLjVINS41ek04LDEzSDguNVYxMy41SDh6TTguNSwxM0g5VjEzLjVIOC41ek05LDEzSDkuNVYxMy41SDl6TTEwLDEzSDEwLjVWMTMuNUgxMHpNMTAuNSwxM0gxMVYxMy41SDEwLjV6TTExLDEzSDExLjVWMTMuNUgxMXpNMTIsMTNIMTIuNVYxMy41SDEyek0xMi41LDEzSDEzVjEzLjVIMTIuNXpNMTMsMTNIMTMuNVYxMy41SDEzek0xMy41LDEzSDE0VjEzLjVIMTMuNXpNMTQsMTNIMTQuNVYxMy41SDE0ek0xNC41LDEzSDE1VjEzLjVIMTQuNXpNMTUsMTNIMTUuNVYxMy41SDE1ek0xNS41LDEzSDE2VjEzLjVIMTUuNXpNMTYuNSwxM0gxN1YxMy41SDE2LjV6TTE3LDEzSDE3LjVWMTMuNUgxN3pNNSwxMy41SDUuNVYxNEg1ek02LjUsMTMuNUg3VjE0SDYuNXpNOC41LDEzLjVIOVYxNEg4LjV6TTksMTMuNUg5LjVWMTRIOXpNMTIsMTMuNUgxMi41VjE0SDEyek0xMi41LDEzLjVIMTNWMTRIMTIuNXpNMTMsMTMuNUgxMy41VjE0SDEzek0xNSwxMy41SDE1LjVWMTRIMTV6TTEsMTRIMS41VjE0LjVIMXpNMS41LDE0SDJWMTQuNUgxLjV6TTIsMTRIMi41VjE0LjVIMnpNMi41LDE0SDNWMTQuNUgyLjV6TTMsMTRIMy41VjE0LjVIM3pNMy41LDE0SDRWMTQuNUgzLjV6TTQsMTRINC41VjE0LjVINHpNNSwxNEg1LjVWMTQuNUg1ek02LDE0SDYuNVYxNC41SDZ6TTYuNSwxNEg3VjE0LjVINi41ek03LDE0SDcuNVYxNC41SDd6TTgsMTRIOC41VjE0LjVIOHpNOC41LDE0SDlWMTQuNUg4LjV6TTEwLDE0SDEwLjVWMTQuNUgxMHpNMTAuNSwxNEgxMVYxNC41SDEwLjV6TTExLDE0SDExLjVWMTQuNUgxMXpNMTEuNSwxNEgxMlYxNC41SDExLjV6TTEzLDE0SDEzLjVWMTQuNUgxM3pNMTQsMTRIMTQuNVYxNC41SDE0ek0xNSwxNEgxNS41VjE0LjVIMTV6TTE2LDE0SDE2LjVWMTQuNUgxNnpNMTYuNSwxNEgxN1YxNC41SDE2LjV6TTEsMTQuNUgxLjVWMTVIMXpNNCwxNC41SDQuNVYxNUg0ek01LDE0LjVINS41VjE1SDV6TTUuNSwxNC41SDZWMTVINS41ek02LDE0LjVINi41VjE1SDZ6TTYuNSwxNC41SDdWMTVINi41ek03LDE0LjVINy41VjE1SDd6TTcuNSwxNC41SDhWMTVINy41ek04LDE0LjVIOC41VjE1SDh6TTksMTQuNUg5LjVWMTVIOXpNMTAuNSwxNC41SDExVjE1SDEwLjV6TTExLDE0LjVIMTEuNVYxNUgxMXpNMTIuNSwxNC41SDEzVjE1SDEyLjV6TTEzLDE0LjVIMTMuNVYxNUgxM3pNMTUsMTQuNUgxNS41VjE1SDE1ek0xNS41LDE0LjVIMTZWMTVIMTUuNXpNMTYsMTQuNUgxNi41VjE1SDE2ek0xNywxNC41SDE3LjVWMTVIMTd6TTEsMTVIMS41VjE1LjVIMXpNMiwxNUgyLjVWMTUuNUgyek0yLjUsMTVIM1YxNS41SDIuNXpNMywxNUgzLjVWMTUuNUgzek00LDE1SDQuNVYxNS41SDR6TTUsMTVINS41VjE1LjVINXpNNiwxNUg2LjVWMTUuNUg2ek03LDE1SDcuNVYxNS41SDd6TTcuNSwxNUg4VjE1LjVINy41ek05LjUsMTVIMTBWMTUuNUg5LjV6TTEwLDE1SDEwLjVWMTUuNUgxMHpNMTEsMTVIMTEuNVYxNS41SDExek0xMS41LDE1SDEyVjE1LjVIMTEuNXpNMTIuNSwxNUgxM1YxNS41SDEyLjV6TTEzLDE1SDEzLjVWMTUuNUgxM3pNMTMuNSwxNUgxNFYxNS41SDEzLjV6TTE0LDE1SDE0LjVWMTUuNUgxNHpNMTQuNSwxNUgxNVYxNS41SDE0LjV6TTE1LDE1SDE1LjVWMTUuNUgxNXpNMTYuNSwxNUgxN1YxNS41SDE2LjV6TTEsMTUuNUgxLjVWMTZIMXpNMiwxNS41SDIuNVYxNkgyek0yLjUsMTUuNUgzVjE2SDIuNXpNMywxNS41SDMuNVYxNkgzek00LDE1LjVINC41VjE2SDR6TTUsMTUuNUg1LjVWMTZINXpNNiwxNS41SDYuNVYxNkg2ek03LDE1LjVINy41VjE2SDd6TTkuNSwxNS41SDEwVjE2SDkuNXpNMTEsMTUuNUgxMS41VjE2SDExek0xMiwxNS41SDEyLjVWMTZIMTJ6TTEyLjUsMTUuNUgxM1YxNkgxMi41ek0xMy41LDE1LjVIMTRWMTZIMTMuNXpNMTQuNSwxNS41SDE1VjE2SDE0LjV6TTE1LjUsMTUuNUgxNlYxNkgxNS41ek0xNiwxNS41SDE2LjVWMTZIMTZ6TTE2LjUsMTUuNUgxN1YxNkgxNi41ek0xNywxNS41SDE3LjVWMTZIMTd6TTEsMTZIMS41VjE2LjVIMXpNMiwxNkgyLjVWMTYuNUgyek0yLjUsMTZIM1YxNi41SDIuNXpNMywxNkgzLjVWMTYuNUgzek00LDE2SDQuNVYxNi41SDR6TTUuNSwxNkg2VjE2LjVINS41ek05LDE2SDkuNVYxNi41SDl6TTkuNSwxNkgxMFYxNi41SDkuNXpNMTEsMTZIMTEuNVYxNi41SDExek0xMS41LDE2SDEyVjE2LjVIMTEuNXpNMTIsMTZIMTIuNVYxNi41SDEyek0xMi41LDE2SDEzVjE2LjVIMTIuNXpNMTUsMTZIMTUuNVYxNi41SDE1ek0xNi41LDE2SDE3VjE2LjVIMTYuNXpNMTcsMTZIMTcuNVYxNi41SDE3ek0xLDE2LjVIMS41VjE3SDF6TTQsMTYuNUg0LjVWMTdINHpNNS41LDE2LjVINlYxN0g1LjV6TTYsMTYuNUg2LjVWMTdINnpNNi41LDE2LjVIN1YxN0g2LjV6TTcuNSwxNi41SDhWMTdINy41ek04LDE2LjVIOC41VjE3SDh6TTguNSwxNi41SDlWMTdIOC41ek05LDE2LjVIOS41VjE3SDl6TTEwLDE2LjVIMTAuNVYxN0gxMHpNMTIsMTYuNUgxMi41VjE3SDEyek0xMy41LDE2LjVIMTRWMTdIMTMuNXpNMTQsMTYuNUgxNC41VjE3SDE0ek0xNSwxNi41SDE1LjVWMTdIMTV6TTE1LjUsMTYuNUgxNlYxN0gxNS41ek0xNiwxNi41SDE2LjVWMTdIMTZ6TTE2LjUsMTYuNUgxN1YxN0gxNi41ek0xNywxNi41SDE3LjVWMTdIMTd6TTEsMTdIMS41VjE3LjVIMXpNMS41LDE3SDJWMTcuNUgxLjV6TTIsMTdIMi41VjE3LjVIMnpNMi41LDE3SDNWMTcuNUgyLjV6TTMsMTdIMy41VjE3LjVIM3pNMy41LDE3SDRWMTcuNUgzLjV6TTQsMTdINC41VjE3LjVINHpNNSwxN0g1LjVWMTcuNUg1ek01LjUsMTdINlYxNy41SDUuNXpNNiwxN0g2LjVWMTcuNUg2ek02LjUsMTdIN1YxNy41SDYuNXpNNy41LDE3SDhWMTcuNUg3LjV6TTgsMTdIOC41VjE3LjVIOHpNOS41LDE3SDEwVjE3LjVIOS41ek0xMS41LDE3SDEyVjE3LjVIMTEuNXpNMTIuNSwxN0gxM1YxNy41SDEyLjV6TTEzLDE3SDEzLjVWMTcuNUgxM3pNMTQsMTdIMTQuNVYxNy41SDE0ek0xNC41LDE3SDE1VjE3LjVIMTQuNXpNMTUsMTdIMTUuNVYxNy41SDE1ek0xNiwxN0gxNi41VjE3LjVIMTZ6IiBpZD0icXItcGF0aCIgZmlsbD0iIzAwMDAwMCIgZmlsbC1vcGFjaXR5PSIxIiBmaWxsLXJ1bGU9Im5vbnplcm8iIHN0cm9rZT0ibm9uZSIvPjwvc3ZnPg==";


const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

const getToken = () => {
  return localStorage.getItem("token");
};

const formatDate = (date) => {
  if (!date) return "Recently";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "Recently";
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getBookIdentifier = (book) => {
  if (!book) return null;

  if (book.id !== null && book.id !== undefined && book.id !== "") {
    return String(book.id);
  }

  if (book.google_book_id) {
    return String(book.google_book_id);
  }

  if (book.google_id) {
    return String(book.google_id);
  }

  return null;
};

/* ======================================================
   USER USAGE TRACKING
   Records real foreground time in 10-second heartbeats.
   A session is closed when the user hides/leaves the page.
====================================================== */
function useUsageTracker({
  token,
  enabled = true,
  activityType = "page",
  resourceKey = null,
  resourceName = null,
}) {
  const sessionIdRef = useRef(null);

  useEffect(() => {
    if (!token || !enabled) {
      sessionIdRef.current = null;
      return undefined;
    }

    let cancelled = false;
    let busy = false;

    const heartbeat = async () => {
      if (cancelled || document.hidden || busy) return;
      busy = true;
      try {
        const response = await fetch(`${API_URL}/api/analytics/heartbeat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            sessionId: sessionIdRef.current,
            activityType,
            resourceKey,
            resourceName,
          }),
        });
        const data = await response.json().catch(() => ({}));
        if (response.ok && data.sessionId) sessionIdRef.current = data.sessionId;
      } catch (error) {
        console.debug("Usage heartbeat skipped:", error.message);
      } finally {
        busy = false;
      }
    };

    const endSession = async () => {
      const id = sessionIdRef.current;
      if (!id) return;
      sessionIdRef.current = null;
      try {
        await fetch(`${API_URL}/api/analytics/end`, {
          method: "POST",
          keepalive: true,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ sessionId: id }),
        });
      } catch {}
    };

    heartbeat();
    const timer = window.setInterval(heartbeat, 10000);

    const onVisibility = () => {
      if (document.hidden) endSession();
      else heartbeat();
    };
    const onPageHide = () => endSession();

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
      endSession();
    };
  }, [token, enabled, activityType, resourceKey, resourceName]);
}

/* ======================================================
   BOOK CARD
====================================================== */

function BookCard({ book, isFavorite, onFavorite, onOpen, onAddToCart }) {
  const openBook = (event) => {
    event?.stopPropagation();
    onOpen(book);
  };

  return (
    <article
      className="book-card"
      onClick={openBook}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openBook(event);
        }
      }}
      tabIndex={0}
    >
      <div className="book-cover-wrapper">
        <img
          src={
            book.cover_url ||
            "https://via.placeholder.com/300x450?text=No+Cover"
          }
          alt={book.title || "Book cover"}
          className="book-cover"
          loading="lazy"
          onError={(event) => {
            event.currentTarget.src =
              "https://via.placeholder.com/300x450?text=No+Cover";
          }}
        />

        <div className="book-overlay">
          <span>View Details</span>
        </div>
      </div>

      <div className="book-info">
        <h3 title={book.title}>{book.title}</h3>

        <p className="book-author">{book.author || "Unknown Author"}</p>

        <div className="book-bottom">
          <span className="book-rating">
            ⭐{" "}
            {book.average_rating !== null && book.average_rating !== undefined
              ? Number(book.average_rating).toFixed(1)
              : "0.0"}
          </span>

          {book.is_for_sale && (
            <strong className="book-price">
              NPR {Number(book.sale_price_npr ?? book.price_npr ?? 0).toLocaleString()}
            </strong>
          )}

          <div className="book-actions">
            {book.is_for_sale && (
              <button
                type="button"
                className="rate-comment-btn"
                onClick={(event) => {
                  event.stopPropagation();
                  onAddToCart(book);
                }}
              >
                🛒 Add to Cart
              </button>
            )}

            <button
              type="button"
              className="rate-comment-btn"
              onClick={openBook}
            >
              ⭐ Rate & Comment
            </button>

            <button
              type="button"
              className={`favorite-btn ${isFavorite ? "active" : ""}`}
              onClick={(event) => {
                event.stopPropagation();
                onFavorite(book);
              }}
              title={isFavorite ? "Remove from favorites" : "Add to favorites"}
              aria-label={
                isFavorite ? "Remove from favorites" : "Add to favorites"
              }
            >
              {isFavorite ? "♥" : "♡"}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

/* ======================================================
   BOOK CAROUSEL
====================================================== */

function BookCarousel({
  title,
  subtitle,
  books,
  favorites,
  onFavorite,
  onOpen,
  onAddToCart,
  loading,
}) {
  const scrollRef = useRef(null);

  const [canScrollLeft, setCanScrollLeft] = useState(false);

  const [canScrollRight, setCanScrollRight] = useState(false);

  const visibleBooks = useMemo(() => (books || []).slice(0, 20), [books]);

  const updateScrollButtons = () => {
    const el = scrollRef.current;

    if (!el) return;

    setCanScrollLeft(el.scrollLeft > 4);

    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    updateScrollButtons();

    const el = scrollRef.current;

    if (!el) return;

    const handleResize = () => {
      updateScrollButtons();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [visibleBooks.length]);

  const scrollByAmount = (direction) => {
    const el = scrollRef.current;

    if (!el) return;

    const cardWidth = el.querySelector(".book-card")?.offsetWidth || 220;

    el.scrollBy({
      left: direction * (cardWidth * 2 + 40),
      behavior: "smooth",
    });
  };

  if (loading) {
    return (
      <section className="book-section">
        <div className="section-header">
          <div>
            <h2>{title}</h2>

            {subtitle && <p>{subtitle}</p>}
          </div>
        </div>

        <p className="loading-text">Loading...</p>
      </section>
    );
  }

  if (!visibleBooks.length) {
    return null;
  }

  return (
    <section className="book-section">
      <div className="section-header">
        <div>
          <h2>{title}</h2>

          {subtitle && <p>{subtitle}</p>}
        </div>

        <span className="book-count">{visibleBooks.length} books</span>
      </div>

      <div className="book-carousel-wrapper">
        {canScrollLeft && (
          <button
            type="button"
            className="scroll-arrow scroll-arrow-left"
            onClick={() => scrollByAmount(-1)}
            aria-label="Scroll left"
          >
            ‹
          </button>
        )}

        <div
          className="book-carousel"
          ref={scrollRef}
          onScroll={updateScrollButtons}
        >
          {visibleBooks.map((book, index) => {
            const identifier = getBookIdentifier(book);

            const key =
              identifier ||
              book.google_book_id ||
              book.google_id ||
              `${book.title || "book"}-${index}`;

            return (
              <BookCard
                key={key}
                book={book}
                isFavorite={identifier ? favorites.has(identifier) : false}
                onFavorite={onFavorite}
                onOpen={onOpen}
                onAddToCart={onAddToCart}
              />
            );
          })}
        </div>

        {canScrollRight && (
          <button
            type="button"
            className="scroll-arrow scroll-arrow-right"
            onClick={() => scrollByAmount(1)}
            aria-label="Scroll right"
          >
            ›
          </button>
        )}
      </div>
    </section>
  );
}

/* ======================================================
   BOOK GRID
====================================================== */

function BookGrid({ title, books, favorites, onFavorite, onOpen, onAddToCart }) {
  if (!books || books.length === 0) {
    return null;
  }

  return (
    <section className="book-section">
      <div className="section-header">
        <div>
          <h2>{title}</h2>
          <p>Discover books you may enjoy</p>
        </div>

        <span className="book-count">{books.length} books</span>
      </div>

      <div className="book-grid">
        {books.map((book, index) => {
          const identifier = getBookIdentifier(book);

          const key =
            identifier ||
            book.google_book_id ||
            book.google_id ||
            `${book.title || "book"}-${index}`;

          return (
            <BookCard
              key={key}
              book={book}
              isFavorite={identifier ? favorites.has(identifier) : false}
              onFavorite={onFavorite}
              onOpen={onOpen}
              onAddToCart={onAddToCart}
            />
          );
        })}
      </div>
    </section>
  );
}

/* ======================================================
   BOOK DETAIL MODAL / FULL BOOK PAGE

   IMPORTANT:
   The OUTER overlay is the scrolling element.
   Therefore overlayRef is attached to the outer div.
====================================================== */

function BookDetailModal({
  book,
  onClose,
  isFavorite,
  onFavorite,
  token,
  onLoginRequired,
  favorites,
  onOpenBook,
  onAddToCart,
  fullPage = false,
}) {
  const bookIdentifier = getBookIdentifier(book);

  const isDatabaseBook = Boolean(bookIdentifier);

  const commentsSectionRef = useRef(null);
  const [commentsSectionVisible, setCommentsSectionVisible] = useState(false);
  useEffect(() => {
    const element = commentsSectionRef.current;
    if (!element || !token) return undefined;
    const observer = new IntersectionObserver(([entry]) => setCommentsSectionVisible(entry.isIntersecting && entry.intersectionRatio >= 0.35), { threshold: [0, 0.35, 0.6, 1] });
    observer.observe(element);
    return () => observer.disconnect();
  }, [token, bookIdentifier]);
  useUsageTracker({ token, enabled: Boolean(token && bookIdentifier && !commentsSectionVisible), activityType: "book", resourceKey: String(bookIdentifier || ""), resourceName: book?.title || "Book" });

  useUsageTracker({ token, enabled: Boolean(token && bookIdentifier && commentsSectionVisible), activityType: "comments", resourceKey: String(bookIdentifier || ""), resourceName: book?.title ? `${book.title} · Comments` : "Comments" });

  /*
   * IMPORTANT:
   * This ref is attached to .book-modal-overlay.
   * That is the element with overflowY: auto.
   */
  const overlayRef = useRef(null);

  const [similarBooks, setSimilarBooks] = useState([]);

  const [loadingSimilar, setLoadingSimilar] = useState(false);

  /* ====================================================
     SCROLL TO TOP WHEN BOOK CHANGES
  ==================================================== */

  useEffect(() => {
    /*
     * Wait until React has rendered the new book.
     * This is especially important when clicking
     * "You Might Also Like".
     */
    const scrollToTop = () => {
      const overlay = overlayRef.current;

      if (overlay) {
        overlay.scrollTo({
          top: 0,
          left: 0,
          behavior: "auto",
        });
      }

      /*
       * Also reset normal document scrolling.
       */
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "auto",
      });

      /*
       * Some browsers keep scrollTop on html/body.
       */
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    /*
     * Run immediately.
     */
    scrollToTop();

    /*
     * Run again after the new DOM has painted.
     */
    const frame = requestAnimationFrame(() => {
      scrollToTop();
    });

    /*
     * Extra safety for image/layout rendering.
     */
    const timer = setTimeout(() => {
      scrollToTop();
    }, 50);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
  }, [bookIdentifier]);

  /* ====================================================
     LOAD SIMILAR BOOKS
  ==================================================== */

  useEffect(() => {
    if (!bookIdentifier) {
      setSimilarBooks([]);
      return;
    }

    let cancelled = false;

    const loadSimilar = async () => {
      try {
        setLoadingSimilar(true);

        const response = await fetch(
          `${API_URL}/api/books/${bookIdentifier}/similar`,
        );

        const data = await response.json();

        if (!cancelled && response.ok) {
          setSimilarBooks(
            Array.isArray(data.similar_books) ? data.similar_books : [],
          );
        }
      } catch (error) {
        console.error("Similar books loading error:", error);
      } finally {
        if (!cancelled) {
          setLoadingSimilar(false);
        }
      }
    };

    loadSimilar();

    return () => {
      cancelled = true;
    };
  }, [bookIdentifier]);

  const [ratings, setRatings] = useState(null);

  const [comments, setComments] = useState([]);

  const [selectedRating, setSelectedRating] = useState(0);

  const [commentText, setCommentText] = useState("");

  const [editingCommentId, setEditingCommentId] = useState(null);

  const [editingCommentText, setEditingCommentText] = useState("");

  const [savingEdit, setSavingEdit] = useState(false);

  const [loadingRatings, setLoadingRatings] = useState(isDatabaseBook);

  const [loadingComments, setLoadingComments] = useState(isDatabaseBook);

  const [savingRating, setSavingRating] = useState(false);

  const [savingComment, setSavingComment] = useState(false);

  const [message, setMessage] = useState("");

  // ----------------------------------------------------
  // "VIEW ALL" TOGGLES
  // ----------------------------------------------------

  const [showAllRatings, setShowAllRatings] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);

  const [showFavoritedBy, setShowFavoritedBy] = useState(false);
  const [favoritedByList, setFavoritedByList] = useState([]);
  const [favoritedByCount, setFavoritedByCount] = useState(0);
  const [loadingFavoritedBy, setLoadingFavoritedBy] = useState(false);
  const [favoritedByLoaded, setFavoritedByLoaded] = useState(false);

  const toggleFavoritedBy = async () => {
    const opening = !showFavoritedBy;

    setShowFavoritedBy(opening);

    if (opening && !favoritedByLoaded && bookIdentifier) {
      try {
        setLoadingFavoritedBy(true);

        const response = await fetch(
          `${API_URL}/api/books/${bookIdentifier}/favorites`,
        );

        const data = await response.json();

        if (response.ok) {
          setFavoritedByList(
            Array.isArray(data.favorited_by) ? data.favorited_by : [],
          );
          setFavoritedByCount(Number(data.count || 0));
          setFavoritedByLoaded(true);
        }
      } catch (error) {
        console.error("Favorited-by loading error:", error);
      } finally {
        setLoadingFavoritedBy(false);
      }
    }
  };

  useEffect(() => {
    setShowAllRatings(false);
    setShowAllComments(false);
    setShowFavoritedBy(false);
    setFavoritedByList([]);
    setFavoritedByCount(0);
    setFavoritedByLoaded(false);
  }, [bookIdentifier]);

  /* ====================================================
     LOAD RATINGS
  ==================================================== */

  useEffect(() => {
    if (!bookIdentifier) return;

    let cancelled = false;

    const loadRatings = async () => {
      try {
        setLoadingRatings(true);

        const response = await fetch(
          `${API_URL}/api/ratings/${bookIdentifier}`,
          {
            headers: token
              ? {
                  Authorization: `Bearer ${token}`,
                }
              : {},
          },
        );

        const data = await response.json();

        if (!cancelled && response.ok) {
          setRatings(data);

          if (data.user_rating !== null && data.user_rating !== undefined) {
            setSelectedRating(Number(data.user_rating));
          } else {
            setSelectedRating(0);
          }
        }
      } catch (error) {
        console.error("Ratings loading error:", error);
      } finally {
        if (!cancelled) {
          setLoadingRatings(false);
        }
      }
    };

    loadRatings();

    return () => {
      cancelled = true;
    };
  }, [bookIdentifier, token]);

  /* ====================================================
     LOAD COMMENTS
  ==================================================== */

  useEffect(() => {
    if (!bookIdentifier) return;

    let cancelled = false;

    const loadComments = async () => {
      try {
        setLoadingComments(true);

        const response = await fetch(
          `${API_URL}/api/comments/${bookIdentifier}`,
        );

        const data = await response.json();

        if (!cancelled && response.ok) {
          setComments(Array.isArray(data) ? data : data.comments || []);
        }
      } catch (error) {
        console.error("Comments loading error:", error);
      } finally {
        if (!cancelled) {
          setLoadingComments(false);
        }
      }
    };

    loadComments();

    return () => {
      cancelled = true;
    };
  }, [bookIdentifier]);

  /* ====================================================
     READING HISTORY
  ==================================================== */

  useEffect(() => {
    if (!bookIdentifier || !token) return;

    fetch(`${API_URL}/api/reading-history`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        book_id: bookIdentifier,
      }),
    }).catch((error) => {
      console.error("Reading history error:", error);
    });
  }, [bookIdentifier, token]);

  /* ====================================================
     RATING
  ==================================================== */

  const handleRating = async (rating) => {
    if (!token) {
      onLoginRequired();
      return;
    }

    if (!bookIdentifier) {
      setMessage("This book isn't in our library yet, so it can't be rated.");
      return;
    }

    try {
      setSavingRating(true);
      setMessage("");

      const response = await fetch(`${API_URL}/api/ratings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          book_id: bookIdentifier,
          rating,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save rating");
      }

      setSelectedRating(rating);

      setRatings((previous) => ({
        ...(previous || {}),
        average_rating: data.average_rating ?? previous?.average_rating,
        total_ratings: data.total_ratings ?? previous?.total_ratings,
      }));

      setMessage("Rating saved successfully.");
    } catch (error) {
      console.error("Rating error:", error);
      setMessage(error.message);
    } finally {
      setSavingRating(false);
    }
  };

  /* ====================================================
     ADD COMMENT
  ==================================================== */

  const handleComment = async (event) => {
    event.preventDefault();

    if (!token) {
      onLoginRequired();
      return;
    }

    if (!bookIdentifier) {
      setMessage(
        "This book isn't in our library yet, so it can't be commented on.",
      );
      return;
    }

    const cleanComment = commentText.trim();

    if (!cleanComment) {
      setMessage("Please write a comment.");
      return;
    }

    try {
      setSavingComment(true);
      setMessage("");

      const response = await fetch(`${API_URL}/api/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          book_id: bookIdentifier,
          comment: cleanComment,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add comment");
      }

      const newComment = data.comment || data;

      setComments((previous) => [newComment, ...previous]);

      setCommentText("");

      setMessage("Comment added successfully.");
    } catch (error) {
      console.error("Comment error:", error);
      setMessage(error.message);
    } finally {
      setSavingComment(false);
    }
  };

  /* ====================================================
     UPDATE COMMENT
  ==================================================== */

  const handleUpdateComment = async (commentId) => {
    if (!token) {
      onLoginRequired();
      return;
    }

    const cleanComment = editingCommentText.trim();

    if (!cleanComment) {
      setMessage("Please write a comment.");
      return;
    }

    try {
      setSavingEdit(true);
      setMessage("");

      const response = await fetch(`${API_URL}/api/comments/${commentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          comment: cleanComment,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update comment");
      }

      const updatedComment = data.comment || data;

      setComments((previous) =>
        previous.map((comment) =>
          Number(comment.id) === Number(commentId)
            ? {
                ...comment,
                ...updatedComment,
                comment: updatedComment.comment || cleanComment,
              }
            : comment,
        ),
      );

      setEditingCommentId(null);
      setEditingCommentText("");

      setMessage("Comment updated successfully.");
    } catch (error) {
      console.error("Update comment error:", error);

      setMessage(error.message);
    } finally {
      setSavingEdit(false);
    }
  };

  /* ====================================================
     DELETE COMMENT
  ==================================================== */

  const handleDeleteComment = async (commentId) => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/comments/${commentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete comment");
      }

      setComments((previous) =>
        previous.filter((comment) => Number(comment.id) !== Number(commentId)),
      );

      setMessage("Comment deleted.");
    } catch (error) {
      console.error("Delete comment error:", error);

      setMessage(error.message);
    }
  };

  /* ====================================================
     ESCAPE KEY
  ==================================================== */

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  if (!book) return null;

  const currentUser = getStoredUser();

  return (
    <div
      /*
       * IMPORTANT:
       * This is the actual scrolling element.
       */
      ref={overlayRef}
      className={
        fullPage ? "book-modal-overlay book-page-overlay" : "book-modal-overlay"
      }
      style={
        fullPage
          ? {
              position: "fixed",
              inset: 0,
              zIndex: 9999,
              padding: 0,
              overflowY: "auto",
              overflowX: "hidden",
              background: `linear-gradient(
                135deg,
                rgba(5,8,18,.97),
                rgba(18,25,45,.94)
              ), url(${book.cover_url || ""}) center/cover fixed`,
            }
          : undefined
      }
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={
          fullPage ? "book-detail-modal book-page-modal" : "book-detail-modal"
        }
        style={
          fullPage
            ? {
                width: "min(1180px, 100%)",
                maxWidth: "1180px",
                minHeight: "100vh",
                margin: "0 auto",
                borderRadius: 0,
                background: "#f8fafc",
                boxShadow: "none",
              }
            : undefined
        }
        role="dialog"
        aria-modal="true"
      >
        {fullPage && (
          <button
            type="button"
            onClick={onClose}
            style={{
              position: "sticky",
              top: 16,
              left: 20,
              zIndex: 30,
              margin: "16px 0 0 20px",
              padding: "10px 16px",
              border: "1px solid #dbe2ea",
              borderRadius: 999,
              background: "rgba(255,255,255,.94)",
              color: "#111827",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            ← Back to Books
          </button>
        )}

        <button
          type="button"
          className="modal-close-btn"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>

        {/* BOOK HEADER */}

        <div className="book-detail-header">
          <div className="book-detail-cover">
            <img
              src={
                book.cover_url ||
                "https://via.placeholder.com/300x450?text=No+Cover"
              }
              alt={book.title}
              onError={(event) => {
                event.currentTarget.src =
                  "https://via.placeholder.com/300x450?text=No+Cover";
              }}
            />
          </div>

          <div className="book-detail-info">
            <span className="detail-badge">BOOK DETAILS</span>

            <h1>{book.title}</h1>

            <p className="detail-author">
              by {book.author || "Unknown Author"}
            </p>

            {book.published_year && (
              <p className="published-text">Published: {book.published_year}</p>
            )}

            <div className="detail-rating">
              ⭐{" "}
              {book.average_rating
                ? Number(book.average_rating).toFixed(1)
                : "0.0"}
              {ratings?.total_ratings !== undefined && (
                <span> ({ratings.total_ratings} ratings)</span>
              )}
            </div>

            <button
              type="button"
              className={`detail-favorite-btn ${isFavorite ? "active" : ""}`}
              onClick={() => onFavorite(book)}
              disabled={!isDatabaseBook}
              title={
                isDatabaseBook
                  ? undefined
                  : "This book isn't in our library yet, so it can't be favorited."
              }
            >
              {!isDatabaseBook
                ? "♡ Not in Library"
                : isFavorite
                  ? "♥ Remove from Favorites"
                  : "♡ Add to Favorites"}
            </button>

            {isDatabaseBook && (
              <>
                <button
                  type="button"
                  className="view-all-btn"
                  onClick={toggleFavoritedBy}
                >
                  {showFavoritedBy
                    ? "Hide"
                    : favoritedByLoaded
                      ? `View Who Favorited (${favoritedByCount})`
                      : "View Who Favorited This Book"}
                </button>

                {showFavoritedBy &&
                  (loadingFavoritedBy ? (
                    <p className="loading-text">Loading...</p>
                  ) : favoritedByList.length === 0 ? (
                    <p className="loading-text">
                      No one has favorited this book yet.
                    </p>
                  ) : (
                    <div className="raters-list">
                      {favoritedByList.map((person) => (
                        <div
                          className="rater-item"
                          key={`${person.user_id}-${person.created_at}`}
                        >
                          <div className="user-avatar">
                            {(person.user_name || "U").charAt(0).toUpperCase()}
                          </div>

                          <div className="rater-info">
                            <strong>{person.user_name || "User"}</strong>

                            <span>
                              {person.created_at
                                ? new Date(person.created_at).toLocaleString()
                                : ""}
                            </span>
                          </div>

                          <span className="rater-score">♥</span>
                        </div>
                      ))}
                    </div>
                  ))}
              </>
            )}
          </div>
        </div>

        {/* DESCRIPTION */}

        <section className="book-description">
          <h2>About This Book</h2>

          <p>{book.description || "No description available for this book."}</p>
        </section>

        {/* RATINGS */}

        <section className="ratings-area">
          <div className="section-title-row">
            <div>
              <h2>Rate This Book</h2>

              <p>
                {!isDatabaseBook
                  ? "This book isn't in our library yet, so it can't be rated."
                  : token
                    ? "Choose a rating from 1 to 5 stars."
                    : "Login to rate this book."}
              </p>
            </div>
          </div>

          <div className="star-rating">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                type="button"
                key={star}
                className={star <= selectedRating ? "selected" : ""}
                onClick={() => handleRating(star)}
                disabled={savingRating || !isDatabaseBook}
                aria-label={`Rate ${star} out of 5`}
              >
                ★
              </button>
            ))}
          </div>

          {savingRating && <p className="saving-text">Saving your rating...</p>}

          {!isDatabaseBook ? null : loadingRatings ? (
            <p className="loading-text">Loading ratings...</p>
          ) : (
            <>
              <div className="rating-summary">
                <div>
                  <strong>
                    {Number(
                      ratings?.average_rating || book.average_rating || 0,
                    ).toFixed(1)}
                  </strong>

                  <span>Average Rating</span>
                </div>

                <div>
                  <strong>{ratings?.total_ratings || 0}</strong>

                  <span>Total Ratings</span>
                </div>
              </div>

              {ratings?.raters?.length > 0 && (
                <>
                  <button
                    type="button"
                    className="view-all-btn"
                    onClick={() => setShowAllRatings((previous) => !previous)}
                  >
                    {showAllRatings
                      ? "Hide Ratings"
                      : `View All Ratings (${ratings.raters.length})`}
                  </button>

                  {showAllRatings && (
                    <div className="raters-list">
                      {ratings.raters.map((rater) => (
                        <div
                          className="rater-item"
                          key={`${rater.user_id}-${rater.created_at}`}
                        >
                          <div className="user-avatar">
                            {(rater.user_name || "U").charAt(0).toUpperCase()}
                          </div>

                          <div className="rater-info">
                            <strong>{rater.user_name || "User"}</strong>

                            <span>
                              {rater.created_at
                                ? new Date(rater.created_at).toLocaleString()
                                : ""}
                            </span>
                          </div>

                          <span className="rater-score">{rater.rating}/5</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </section>

        {/* COMMENTS */}

        <section ref={commentsSectionRef} className="comments-area">
          <div className="section-title-row">
            <div>
              <h2>Comments & Reviews</h2>

              <p>
                {isDatabaseBook
                  ? "Share your thoughts about this book."
                  : "This book isn't in our library yet, so it can't be commented on."}
              </p>
            </div>
          </div>

          <form onSubmit={handleComment} className="comment-form">
            <textarea
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              placeholder={
                !isDatabaseBook
                  ? "Comments aren't available for this book yet."
                  : token
                    ? "Write your comment..."
                    : "Login to write a comment..."
              }
              maxLength={1000}
              disabled={savingComment || !isDatabaseBook}
            />

            <div className="comment-form-bottom">
              <span>{commentText.length}/1000</span>

              <button
                type="submit"
                disabled={
                  savingComment || !commentText.trim() || !isDatabaseBook
                }
                className="comment-submit-btn"
              >
                {savingComment
                  ? "Posting..."
                  : token
                    ? "Post Comment"
                    : "Login to Comment"}
              </button>
            </div>
          </form>

          {message && <div className="action-message">{message}</div>}

          {!isDatabaseBook ? null : loadingComments ? (
            <p className="loading-text">Loading comments...</p>
          ) : comments.length === 0 ? (
            <div className="no-comments">
              <div className="empty-comment-icon">💬</div>

              <h3>No comments yet</h3>

              <p>Be the first person to share your thoughts.</p>
            </div>
          ) : (
            <>
              {comments.length > 3 && (
                <button
                  type="button"
                  className="view-all-btn"
                  onClick={() => setShowAllComments((previous) => !previous)}
                >
                  {showAllComments
                    ? "Show Fewer Comments"
                    : `View All ${comments.length} Comments`}
                </button>
              )}

              <div className="comments-list">
                {(showAllComments ? comments : comments.slice(0, 3)).map(
                  (comment) => {
                    const isOwner =
                      token &&
                      currentUser &&
                      Number(comment.user_id) === Number(currentUser.id);

                    return (
                      <div className="comment-item" key={comment.id}>
                        <div className="comment-top">
                          <div className="comment-user">
                            <div className="user-avatar">
                              {(comment.user_name || comment.username || "U")
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>
                              <strong>
                                {comment.user_name ||
                                  comment.username ||
                                  "User"}
                              </strong>

                              <span>
                                {comment.created_at
                                  ? new Date(
                                      comment.created_at,
                                    ).toLocaleString()
                                  : ""}
                              </span>
                            </div>
                          </div>

                          {isOwner && (
                            <div className="comment-owner-actions">
                              <button
                                type="button"
                                className="edit-comment-btn"
                                onClick={() => {
                                  setEditingCommentId(comment.id);

                                  setEditingCommentText(comment.comment);

                                  setMessage("");
                                }}
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                className="delete-comment-btn"
                                onClick={() => handleDeleteComment(comment.id)}
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>

                        {editingCommentId === comment.id ? (
                          <div className="edit-comment-form">
                            <textarea
                              value={editingCommentText}
                              onChange={(event) =>
                                setEditingCommentText(event.target.value)
                              }
                              maxLength={1000}
                              disabled={savingEdit}
                              autoFocus
                            />

                            <div className="edit-comment-actions">
                              <span>
                                {editingCommentText.length}
                                /1000
                              </span>

                              <div>
                                <button
                                  type="button"
                                  className="cancel-edit-btn"
                                  onClick={() => {
                                    setEditingCommentId(null);

                                    setEditingCommentText("");
                                  }}
                                  disabled={savingEdit}
                                >
                                  Cancel
                                </button>

                                <button
                                  type="button"
                                  className="save-edit-btn"
                                  onClick={() =>
                                    handleUpdateComment(comment.id)
                                  }
                                  disabled={
                                    savingEdit || !editingCommentText.trim()
                                  }
                                >
                                  {savingEdit ? "Saving..." : "Save Changes"}
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p>{comment.comment}</p>
                        )}
                      </div>
                    );
                  },
                )}
              </div>
            </>
          )}
        </section>

        {/* YOU MIGHT ALSO LIKE */}

        {isDatabaseBook && (
          <section className="recommended-area">
            {loadingSimilar ? (
              <>
                <h2>You Might Also Like</h2>

                <p className="loading-text">Finding similar books...</p>
              </>
            ) : similarBooks.length > 0 ? (
              <BookCarousel
                title="You Might Also Like"
                subtitle="Similar in genre, author, and description"
                books={similarBooks}
                favorites={favorites}
                onFavorite={onFavorite}
                /*
                 * IMPORTANT:
                 * Do NOT manually change hash or scroll here.
                 * navigateToBook handles everything.
                 */
                onOpen={onOpenBook}
                onAddToCart={onAddToCart}
              />
            ) : null}
          </section>
        )}
      </div>
    </div>
  );
}

/* ======================================================
   CART DRAWER
====================================================== */

function CartDrawer({
  items,
  total,
  onClose,
  onUpdateQuantity,
  onRemove,
  onCheckout,
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        background: "rgba(15, 23, 42, 0.45)",
      }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          height: "100%",
          width: "min(440px, 100%)",
          background: "#fff",
          boxShadow: "-12px 0 40px rgba(0,0,0,.18)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ padding: 22, borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ margin: 0 }}>Your Cart</h2>
            <p style={{ margin: "5px 0 0", color: "#6b7280" }}>
              {items.length} {items.length === 1 ? "item" : "items"}
            </p>
          </div>
          <button type="button" onClick={onClose} style={{ border: 0, background: "transparent", fontSize: 26, cursor: "pointer" }}>×</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 18 }}>
          {items.length === 0 ? (
            <div style={{ textAlign: "center", padding: "70px 20px", color: "#6b7280" }}>
              <div style={{ fontSize: 50 }}>🛒</div>
              <h3>Your cart is empty</h3>
              <p>Add a book to get started.</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.book_id} style={{ display: "flex", gap: 12, padding: "14px 0", borderBottom: "1px solid #eef2f7" }}>
                <img
                  src={item.cover_url || "https://via.placeholder.com/60x85?text=Book"}
                  alt={item.title}
                  style={{ width: 60, height: 85, objectFit: "cover", borderRadius: 7 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong style={{ display: "block" }}>{item.title}</strong>
                  <span style={{ display: "block", color: "#6b7280", fontSize: 13, marginTop: 3 }}>
                    {item.author || "Unknown Author"}
                  </span>
                  <strong style={{ display: "block", marginTop: 8 }}>
                    NPR {Number(item.unit_price).toLocaleString()}
                  </strong>

                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 9 }}>
                    <button type="button" onClick={() => item.quantity > 1 ? onUpdateQuantity(item.book_id, item.quantity - 1) : onRemove(item.book_id)} style={{ width: 30, height: 30 }}>−</button>
                    <span>{item.quantity}</span>
                    <button type="button" onClick={() => onUpdateQuantity(item.book_id, item.quantity + 1)} style={{ width: 30, height: 30 }}>+</button>
                    <button type="button" onClick={() => onRemove(item.book_id)} style={{ marginLeft: "auto", border: 0, background: "transparent", color: "#dc2626", cursor: "pointer" }}>
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div style={{ padding: 20, borderTop: "1px solid #e5e7eb" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, fontWeight: 800, marginBottom: 14 }}>
              <span>Total</span>
              <span>NPR {Number(total).toLocaleString()}</span>
            </div>
            <button
              type="button"
              onClick={onCheckout}
              style={{ width: "100%", padding: "13px 16px", border: 0, borderRadius: 10, background: "#4f46e5", color: "#fff", fontWeight: 800, cursor: "pointer" }}
            >
              Proceed to Checkout
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}

/* ======================================================
   CHECKOUT MODAL
====================================================== */

function CheckoutModal({ total, loading, error, onClose, onPayment }) {
  const [method, setMethod] = useState(null);
  const [options, setOptions] = useState(null);
  const [reference, setReference] = useState("");
  const [optionsLoading, setOptionsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setOptionsLoading(true);
    fetch(`${API_URL}/api/payments/manual/options`)
      .then((response) => response.json())
      .then((data) => {
        if (!cancelled) setOptions(data.options || null);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setOptionsLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const submitManual = () => {
    onPayment(method, reference.trim());
  };

  const selectedCrypto = method === "btc" || method === "usdt";

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 10001, background: "rgba(15, 23, 42, .6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, overflowY: "auto" }}>
      <div style={{ width: "min(560px, 100%)", background: "#fff", borderRadius: 18, padding: 24, maxHeight: "92vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ margin: 0 }}>Checkout</h2>
            <p style={{ color: "#6b7280", marginBottom: 0 }}>Choose how you want to pay</p>
          </div>
          <button type="button" onClick={onClose} style={{ border: 0, background: "transparent", fontSize: 24, cursor: "pointer" }}>×</button>
        </div>

        <div style={{ background: "#f8fafc", borderRadius: 12, padding: 14, margin: "16px 0" }}>
          <span style={{ color: "#64748b" }}>Amount to pay</span>
          <strong style={{ display: "block", fontSize: 25, marginTop: 3 }}>NPR {Number(total).toLocaleString()}</strong>
        </div>

        {error && (
          <div style={{ background: "#fef2f2", color: "#b91c1c", padding: 12, borderRadius: 9, marginBottom: 14 }}>
            {error}
          </div>
        )}

        {!method && (
          <div style={{ display: "grid", gap: 10 }}>
            <button type="button" disabled={loading} onClick={() => onPayment("esewa")} style={{ width: "100%", padding: 15, borderRadius: 12, border: "1px solid #16a34a", background: "#f0fdf4", fontWeight: 800, cursor: "pointer", textAlign: "left" }}>
              <span style={{ display: "block" }}>eSewa</span>
              <small style={{ color: "#64748b" }}>Pay online through eSewa</small>
            </button>

            <button type="button" disabled={loading || optionsLoading} onClick={() => setMethod("bank")} style={{ width: "100%", padding: 15, borderRadius: 12, border: "1px solid #2563eb", background: "#eff6ff", fontWeight: 800, cursor: "pointer", textAlign: "left" }}>
              <span style={{ display: "block" }}>🏦 Online Banking / Bank Transfer</span>
              <small style={{ color: "#64748b" }}>Transfer to our bank account and submit the reference</small>
            </button>

            <button type="button" disabled={loading || optionsLoading} onClick={() => setMethod("btc")} style={{ width: "100%", padding: 15, borderRadius: 12, border: "1px solid #d97706", background: "#fffbeb", fontWeight: 800, cursor: "pointer", textAlign: "left" }}>
              <span style={{ display: "block" }}>₿ Bitcoin</span>
              <small style={{ color: "#64748b" }}>Pay using the Bitcoin address and QR</small>
            </button>

            <button type="button" disabled={loading || optionsLoading} onClick={() => setMethod("usdt")} style={{ width: "100%", padding: 15, borderRadius: 12, border: "1px solid #059669", background: "#ecfdf5", fontWeight: 800, cursor: "pointer", textAlign: "left" }}>
              <span style={{ display: "block" }}>₮ USDT</span>
              <small style={{ color: "#64748b" }}>USDT on TON — address and QR below</small>
            </button>
          </div>
        )}

        {method && (
          <div>
            <button type="button" onClick={() => { setMethod(null); setReference(""); }} style={{ border: 0, background: "transparent", padding: 0, color: "#4f46e5", fontWeight: 800, cursor: "pointer", marginBottom: 14 }}>← Back to payment methods</button>

            {method === "bank" && (
              <div style={{ border: "1px solid #dbeafe", background: "#eff6ff", borderRadius: 14, padding: 18 }}>
                <h3 style={{ marginTop: 0 }}>Bank transfer</h3>
                <p style={{ color: "#475569", fontSize: 13 }}>Transfer exactly the order amount, then enter your bank transaction/reference number below. Your order stays pending until an admin verifies the transfer.</p>
                <div style={{ textAlign: "center", margin: "12px 0 16px" }}>
                  <img src={BANK_QR_SRC} alt="BookWise bank transfer details QR code" style={{ width: 210, height: 210, background: "#fff", border: "1px solid #dbeafe", borderRadius: 10, padding: 8 }} />
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 8 }}>Scan to view the BookWise bank transfer details</div>
                </div>
                <div style={{ display: "grid", gap: 8, fontSize: 14 }}>
                  <div><strong>Bank:</strong> {options?.bank?.name || "Not configured"}</div>
                  <div><strong>Account name:</strong> {options?.bank?.accountName || "Not configured"}</div>
                  <div><strong>Account number:</strong> {options?.bank?.accountNumber || "Not configured"}</div>
                  <div><strong>Branch:</strong> {options?.bank?.branch || "Not configured"}</div>
                  {options?.bank?.swift && <div><strong>SWIFT:</strong> {options.bank.swift}</div>}
                </div>
                <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Bank transaction/reference number" style={{ width: "100%", boxSizing: "border-box", marginTop: 16, padding: 12, border: "1px solid #cbd5e1", borderRadius: 9 }} />
              </div>
            )}

            {selectedCrypto && (
              <div style={{ border: "1px solid #e2e8f0", borderRadius: 14, padding: 18, textAlign: "center" }}>
                <h3 style={{ marginTop: 0 }}>{method === "btc" ? "Bitcoin payment" : "USDT payment"}</h3>
                <img src={method === "btc" ? BTC_QR_SRC : USDT_QR_SRC} alt={`${method === "btc" ? "Bitcoin" : "USDT"} payment QR`} style={{ width: 210, height: 210, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 8 }} />
                <p style={{ fontSize: 12, color: "#64748b", margin: "12px 0 6px" }}>Scan this QR or copy the address. Send the equivalent of <strong>NPR {Number(total).toLocaleString()}</strong>. Crypto payments are manually verified before the order is marked paid.</p>
                {method === "usdt" && <p style={{ fontSize: 12, color: "#b45309", fontWeight: 800 }}>Network: TON. Send USDT only over TON to this address.</p>}
                <div style={{ display: "flex", gap: 8, alignItems: "stretch", marginTop: 10 }}>
                  <input readOnly value={method === "btc" ? BTC_ADDRESS : USDT_ADDRESS} style={{ flex: 1, minWidth: 0, padding: 10, border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 12 }} />
                  <button type="button" onClick={() => navigator.clipboard?.writeText(method === "btc" ? BTC_ADDRESS : USDT_ADDRESS)} style={{ border: 0, borderRadius: 8, padding: "0 12px", background: "#0f172a", color: "#fff", fontWeight: 800, cursor: "pointer" }}>Copy</button>
                </div>
                <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Transaction hash / reference (optional)" style={{ width: "100%", boxSizing: "border-box", marginTop: 12, padding: 12, border: "1px solid #cbd5e1", borderRadius: 9 }} />
              </div>
            )}

            <button type="button" disabled={loading || (method === "bank" && !reference.trim())} onClick={submitManual} style={{ width: "100%", marginTop: 14, padding: 14, border: 0, borderRadius: 10, background: "#111827", color: "#fff", fontWeight: 800, cursor: "pointer" }}>
              {loading ? "Submitting..." : "I have completed the payment"}
            </button>
          </div>
        )}

        <p style={{ fontSize: 12, color: "#64748b", marginTop: 16, lineHeight: 1.5 }}>
          eSewa is verified automatically by the server. Bank and crypto payments are recorded as pending and require manual verification before fulfillment.
        </p>
      </div>
    </div>
  );
}

/* ======================================================
   AUTH MODAL
====================================================== */

function AuthModal({ mode, setMode, onClose, onSuccess }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const currentMode = mode;
  const isForgot = currentMode === "forgot";
  const isResetVerify = currentMode === "verify-code";
  const isRegisterVerify = currentMode === "register-verify";
  const isReset = currentMode === "reset";

  useEffect(() => {
    if (mode === "reset") {
      const params = new URLSearchParams(window.location.search);
      const queryToken = params.get("reset_token");
      if (queryToken) setResetToken(queryToken);
    }
  }, [mode]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      let endpoint = "/api/auth/login";
      let body = { email, password };

      if (currentMode === "register") {
        endpoint = "/api/auth/register/start";
        body = { name, email, password };
      } else if (isRegisterVerify) {
        endpoint = "/api/auth/register/verify";
        body = { email, code };
      } else if (isForgot) {
        endpoint = "/api/auth/forgot-password";
        body = { email };
      } else if (isResetVerify) {
        endpoint = "/api/auth/verify-reset-code";
        body = { email, code };
      } else if (isReset) {
        endpoint = "/api/auth/reset-password";
        body = { token: resetToken, password };
      }

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || data.message || "Request failed");

      if (currentMode === "register") {
        setCode("");
        setMessage(data.message || "A 5-digit verification code has been sent to your email.");
        setMode("register-verify");
        return;
      }

      if (isRegisterVerify) {
        if (data.token) localStorage.setItem("token", data.token);
        if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
        setMessage(data.message || "Email verified and account created successfully.");
        onSuccess(data);
        return;
      }

      if (isForgot) {
        setCode("");
        setMessage(data.message || "A 5-digit verification code has been sent to your email.");
        setMode("verify-code");
        return;
      }

      if (isResetVerify) {
        setResetToken(data.resetToken || "");
        setMessage(data.message || "Code verified.");
        setMode("reset");
        return;
      }

      if (isReset) {
        setMessage(data.message || "Password reset successfully.");
        window.history.replaceState({}, document.title, window.location.pathname);
        setTimeout(() => setMode("login"), 1200);
        return;
      }

      if (data.token) localStorage.setItem("token", data.token);
      if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
      onSuccess(data);
    } catch (error) {
      console.error("Authentication error:", error);
      setError(error.message || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const endpoint = isRegisterVerify
        ? "/api/auth/register/start"
        : "/api/auth/forgot-password";
      const body = isRegisterVerify
        ? { name, email, password }
        : { email };

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || data.message || "Unable to resend code");
      setMessage(data.message || "A new 5-digit verification code has been sent.");
      setCode("");
    } catch (error) {
      setError(error.message || "Unable to resend code");
    } finally {
      setLoading(false);
    }
  };

  const goBackToRegister = () => {
    setError("");
    setMessage("");
    setCode("");
    setMode("register");
  };

  return (
    <div className="auth-modal-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="auth-modal">
        <button type="button" className="modal-close-btn" onClick={onClose}>×</button>
        <div className="auth-modal-header">
          <span className="auth-logo">📚</span>
          <h2>
            {isForgot
              ? "Forgot Password"
              : isResetVerify || isRegisterVerify
                ? "Verify Your Email"
                : isReset
                  ? "Create New Password"
                  : currentMode === "login"
                    ? "Welcome Back"
                    : "Create Your Account"}
          </h2>
          <p>
            {isForgot
              ? "Enter your email and we'll send you a 5-digit verification code."
              : isRegisterVerify
                ? `Enter the 5-digit code sent to ${email}. Your BookWise account will be created after verification.`
                : isResetVerify
                  ? `Enter the 5-digit code sent to ${email}.`
                  : isReset
                    ? "Choose a new password for your BookWise account."
                    : currentMode === "login"
                      ? "Login to continue using BookWise."
                      : "Join BookWise. First verify your email, then your account will be created."}
          </p>
        </div>

        {error && <div className="auth-error">{error}</div>}
        {message && <div style={{ background: "#ecfdf5", color: "#166534", padding: 12, borderRadius: 10, marginBottom: 14, fontSize: 14 }}>{message}</div>}

        {(isRegisterVerify || isResetVerify) && (
          <div style={{ background: "#eff6ff", color: "#1e3a8a", padding: 14, borderRadius: 10, marginBottom: 16, fontSize: 13 }}>
            Check your inbox for the <strong>5-digit code</strong>. It expires in 10 minutes.
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {currentMode === "register" && (
            <div className="form-group">
              <label>Name</label>
              <input type="text" placeholder="Your name" value={name} onChange={(event) => setName(event.target.value)} minLength={2} required />
            </div>
          )}

          {(currentMode === "login" || currentMode === "register" || isForgot || isResetVerify || isRegisterVerify) && (
            <div className="form-group">
              <label>Email</label>
              <input type="email" placeholder="Email address" value={email} onChange={(event) => setEmail(event.target.value)} required disabled={isResetVerify || isRegisterVerify} />
            </div>
          )}

          {(isResetVerify || isRegisterVerify) && (
            <div className="form-group">
              <label>5-digit verification code</label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={5}
                pattern="[0-9]{5}"
                placeholder="12345"
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 5))}
                style={{ textAlign: "center", letterSpacing: "8px", fontSize: 24, fontWeight: 800 }}
                required
                autoFocus
              />
            </div>
          )}

          {(currentMode === "login" || currentMode === "register" || isReset) && (
            <div className="form-group">
              <label>{isReset ? "New Password" : "Password"}</label>
              <input
                type="password"
                placeholder={isReset ? "At least 8 characters" : "Password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={8}
                required
                autoFocus={isReset}
              />
            </div>
          )}

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading
              ? "Please wait..."
              : currentMode === "register"
                ? "Send Verification Code"
                : isRegisterVerify
                  ? "Verify & Create Account"
                  : isForgot
                    ? "Send Verification Code"
                    : isResetVerify
                      ? "Verify Code"
                      : isReset
                        ? "Reset Password"
                        : "Login"}
          </button>
        </form>

        {(isRegisterVerify || isResetVerify) && (
          <button type="button" onClick={resendCode} disabled={loading} style={{ display: "block", margin: "14px auto 0", border: 0, background: "transparent", color: "#4f46e5", fontWeight: 800, cursor: "pointer" }}>
            Resend code
          </button>
        )}

        <div className="auth-switch">
          {currentMode === "login" ? (
            <>
              <button type="button" onClick={() => { setError(""); setMessage(""); setMode("forgot"); }} style={{ marginRight: 12 }}>Forgot password?</button>
              Don't have an account? <button type="button" onClick={() => { setError(""); setMessage(""); setMode("register"); }}>Register</button>
            </>
          ) : isRegisterVerify ? (
            <button type="button" onClick={goBackToRegister}>Back to Registration</button>
          ) : isForgot || isResetVerify || isReset ? (
            <button type="button" onClick={() => { setError(""); setMessage(""); setMode("login"); }}>Back to Login</button>
          ) : (
            <>Already have an account? <button type="button" onClick={() => { setError(""); setMessage(""); setMode("login"); }}>Login</button></>
          )}
        </div>
      </div>
    </div>
  );
}

// ======================================================
// ADMIN PORTAL AUTHENTICATION
// ======================================================

function AdminPortal({ onBackToBookWise, onAdminSuccess }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const endpoint = mode === "login" ? "/api/admin/login" : "/api/admin/register";
      const body = mode === "login"
        ? { email, password }
        : { name, email, password, inviteCode };
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || data.message || "Admin authentication failed.");
      if (data.token) localStorage.setItem("token", data.token);
      if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
      onAdminSuccess(data);
    } catch (err) {
      console.error("Admin portal error:", err);
      setError(err.message || "Unable to continue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-auth-page">
      <div className="admin-auth-card">
        <div className="admin-auth-icon">🛡️</div>
        <span className="admin-auth-eyebrow">BOOKWISE ADMIN PORTAL</span>
        <h1>{mode === "login" ? "Administrator Login" : "Register as Administrator"}</h1>
        <p>{mode === "login" ? "Authorized administrators only." : "A current administrator must generate a 6-digit invitation code before registration."}</p>

        {error && <div className="admin-auth-error">{error}</div>}
        {message && <div className="admin-auth-message">{message}</div>}

        <form onSubmit={submit} className="admin-auth-form">
          {mode === "register" && (
            <label>
              Full name
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Administrator name" required />
            </label>
          )}
          <label>
            Admin email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@example.com" required />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" minLength={8} required />
          </label>
          {mode === "register" && (
            <label>
              6-digit invitation code
              <input className="admin-code-input" inputMode="numeric" maxLength={6} value={inviteCode} onChange={(e) => setInviteCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="123456" required />
              <small>Get this code from an existing BookWise administrator.</small>
            </label>
          )}
          <button className="admin-auth-submit" disabled={loading} type="submit">
            {loading ? "Please wait..." : mode === "login" ? "Login to Admin Dashboard" : "Create Admin Account"}
          </button>
        </form>

        <div className="admin-auth-switch">
          {mode === "login" ? (
            <>Need an admin account? <button type="button" onClick={() => { setMode("register"); setError(""); }}>Register with invite code</button></>
          ) : (
            <>Already registered? <button type="button" onClick={() => { setMode("login"); setError(""); }}>Admin login</button></>
          )}
        </div>
        <button type="button" className="admin-auth-back" onClick={onBackToBookWise}>← Back to BookWise</button>
      </div>
    </div>
  );
}

// ======================================================
// CUSTOMER SUPPORT WIDGET
// ======================================================

function SupportWidget({ user }) {
  // Keep support state separate for each logged-in account. This prevents one
  // browser user from accidentally reusing another user's conversation id.
  const identityKey = user?.id ? `user-${user.id}` : "guest";
  const conversationStorageKey = `bookwise_support_conversation_${identityKey}`;
  const visitorStorageKey = `bookwise_support_visitor_${identityKey}`;

  const [open, setOpen] = useState(false);
  const [conversationId, setConversationId] = useState(() => localStorage.getItem(conversationStorageKey) || "");
  const [visitorToken] = useState(() => {
    let value = localStorage.getItem(visitorStorageKey);
    if (!value) {
      value = `${cryptoRandomId()}-${Date.now()}`;
      localStorage.setItem(visitorStorageKey, value);
    }
    return value;
  });
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setConversationId(localStorage.getItem(conversationStorageKey) || "");
    setMessages([]);
    setError("");
  }, [identityKey]);

  const authHeaders = () => ({
    "x-support-visitor": visitorToken,
    ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
  });

  const loadConversation = async (id = conversationId) => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/support/conversations/${id}`, {
        headers: authHeaders(),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || data.detail || `Unable to load support chat (${response.status}).`);
      setMessages(Array.isArray(data.messages) ? data.messages : []);
      setError("");
    } catch (err) {
      // If this conversation belongs to another login/session, forget it.
      if (/access to this conversation|conversation not found|unable to load support chat/i.test(String(err.message || ""))) {
        localStorage.removeItem(conversationStorageKey);
        setConversationId("");
        setMessages([]);
      }
      setError(err.message || "Unable to load support chat.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open || !conversationId) return;
    loadConversation(conversationId);
    const timer = setInterval(() => loadConversation(conversationId), 2500);
    return () => clearInterval(timer);
  }, [open, conversationId, identityKey]);

  const sendMessage = async () => {
    const text = draft.trim();
    if (!text || sending) return;

    setSending(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/api/support/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ visitorToken, message: text }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || data.detail || `Support request failed (${response.status}).`);

      const id = String(data.conversationId);
      setConversationId(id);
      localStorage.setItem(conversationStorageKey, id);
      setDraft("");
      setMessages((items) => [...items, data.message].filter(Boolean));
      await loadConversation(id);
    } catch (err) {
      setError(err.message || "Unable to send message.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button type="button" className={`support-launcher ${open ? "open" : ""}`} onClick={() => setOpen(true)}>
        💬 <span>Customer Support</span>
      </button>
      {open && (
        <div className="support-widget">
          <div className="support-header">
            <div>
              <strong>BookWise Support</strong>
              <span>We usually reply shortly</span>
            </div>
            <button type="button" onClick={() => setOpen(false)}>×</button>
          </div>

          <div className="support-status">
            {user
              ? <>Signed in as <strong>{user.name || "BookWise customer"}</strong> · {user.email}</>
              : "Chat as a guest — no registration required"}
          </div>

          <div className="support-messages">
            {messages.length === 0 ? (
              <div className="support-empty">
                <div>💬</div>
                <h3>How can we help?</h3>
                <p>Send us a message and an administrator will reply here.</p>
              </div>
            ) : messages.map((item) => (
              <div key={item.id} className={`support-message ${item.sender_type === "admin" ? "admin" : "customer"}`}>
                <span>{item.sender_type === "admin" ? "BookWise Admin" : user?.name || "You"}</span>
                <p>{item.message}</p>
                <small>{new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small>
              </div>
            ))}
          </div>

          {error && <div className="support-error">{error}</div>}
          <div className="support-compose">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Type your message..."
              maxLength={2000}
              disabled={sending}
            />
            <button type="button" onClick={sendMessage} disabled={sending || !draft.trim()}>
              {sending ? "..." : "Send"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function cryptoRandomId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

async function loadConversationForId(id, visitorToken, setMessages, setError) {
  try {
    const response = await fetch(`${API_URL}/api/support/conversations/${id}`, {
      headers: { "x-support-visitor": visitorToken, ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}) },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Unable to load support chat.");
    setMessages(Array.isArray(data.messages) ? data.messages : []);
    setError("");
  } catch (err) {
    setError(err.message || "Unable to load support chat.");
  }
}

// ======================================================
// ADMIN DASHBOARD
// ======================================================

function AdminDashboard({ user, token, onLogout, onBackToBookWise }) {
  const [activeTab, setActiveTab] = useState("overview");

  const [stats, setStats] = useState({
    users: 0,
    books: 0,
    favorites: 0,
    comments: 0,
    ratings: 0,
  });

  const [users, setUsers] = useState([]);
  const [books, setBooks] = useState([]);
  const [selectedActivityUser, setSelectedActivityUser] = useState(null);
  const [userActivity, setUserActivity] = useState(null);
  const [userActivityLoading, setUserActivityLoading] = useState(false);
  const [userActivityError, setUserActivityError] = useState('');
  const [recentUserActivity, setRecentUserActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState("");
  const [usageAnalytics, setUsageAnalytics] = useState({ users: [], sessions: [], books: [], pages: [] });
  const [usageLoading, setUsageLoading] = useState(false);
  const [usageError, setUsageError] = useState("");
  const [usageUserFilter, setUsageUserFilter] = useState("");
  const [usageActivityFilter, setUsageActivityFilter] = useState("all");
  const [payments, setPayments] = useState([]);
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [verifyingPaymentId, setVerifyingPaymentId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [supportConversations, setSupportConversations] = useState([]);
  const [supportConversation, setSupportConversation] = useState(null);
  const [supportMessages, setSupportMessages] = useState([]);
  const [supportDraft, setSupportDraft] = useState("");
  const [supportLoading, setSupportLoading] = useState(false);
  const [supportError, setSupportError] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [inviteExpires, setInviteExpires] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);

  /*
   * DETAIL DRILL-DOWN STATE
   *
   * When an admin clicks a stat card (Comments, Favorites,
   * Ratings) we open a modal that lists every individual
   * record of that type, along with which book and which
   * user it belongs to.
   */

  const [detailType, setDetailType] = useState(null); // "comments" | "favorites" | "ratings" | null
  const [detailItems, setDetailItems] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  /*
   * BOOK FORM STATE
   *
   * bookForm holds the fields for the Add/Edit modal.
   * editingBookId is null when adding a new book, and
   * set to a book's id when editing an existing one.
   */

  const emptyBookForm = {
    title: "",
    author: "",
    description: "",
    cover_url: "",
    published_year: "",
    price_npr: "",
    sale_price_npr: "",
    is_for_sale: true,
  };

  const [bookForm, setBookForm] = useState(emptyBookForm);

  const [editingBookId, setEditingBookId] = useState(null);

  const [showBookForm, setShowBookForm] = useState(false);

  const [savingBook, setSavingBook] = useState(false);

  const [bookFormError, setBookFormError] = useState("");

  const [deletingBookId, setDeletingBookId] = useState(null);

  // ------------------------------------------------------
  // ADMIN API HELPER
  // ------------------------------------------------------

  const adminFetch = async (endpoint, options = {}) => {
    const currentToken = localStorage.getItem("token");

    if (!currentToken) {
      throw new Error("Admin session expired. Please login again.");
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${currentToken}`,
        "Content-Type": "application/json",
      },
    });

    let data = {};

    try {
      data = await response.json();
    } catch {
      data = {};
    }

    if (response.status === 401) {
      throw new Error("Your session has expired. Please login again.");
    }

    if (response.status === 403) {
      throw new Error("Admin access required.");
    }

    if (!response.ok) {
      throw new Error(
        data.error ||
          data.message ||
          `Request failed with status ${response.status}`,
      );
    }

    return data;
  };

  // ------------------------------------------------------
  // LOAD ADMIN DATA
  // ------------------------------------------------------

  const loadAdminData = async () => {
    try {
      setLoading(true);
      setError("");

      /*
       * These call the routes added in server.js:
       * GET /api/admin/stats
       * GET /api/admin/users
       * GET /api/admin/books
       */

      const results = await Promise.allSettled([
        adminFetch("/api/admin/stats"),
        adminFetch("/api/admin/users"),
        adminFetch("/api/admin/books"),
        adminFetch("/api/admin/payments"),
        adminFetch("/api/admin/activity?limit=200"),
      ]);

      // -----------------------------
      // STATS
      // -----------------------------

      if (results[0].status === "fulfilled") {
        const data = results[0].value;

        setStats({
          users: Number(data.users ?? data.totalUsers ?? data.total_users ?? 0),

          books: Number(data.books ?? data.totalBooks ?? data.total_books ?? 0),

          favorites: Number(
            data.favorites ?? data.totalFavorites ?? data.total_favorites ?? 0,
          ),

          comments: Number(
            data.comments ?? data.totalComments ?? data.total_comments ?? 0,
          ),

          ratings: Number(
            data.ratings ?? data.totalRatings ?? data.total_ratings ?? 0,
          ),
        });
      }

      // -----------------------------
      // USERS
      // -----------------------------

      if (results[1].status === "fulfilled") {
        const data = results[1].value;

        setUsers(
          Array.isArray(data)
            ? data
            : Array.isArray(data.users)
              ? data.users
              : [],
        );
      }

      // -----------------------------
      // BOOKS
      // -----------------------------

      if (results[2].status === "fulfilled") {
        const data = results[2].value;

        setBooks(
          Array.isArray(data)
            ? data
            : Array.isArray(data.books)
              ? data.books
              : [],
        );
      }

      // -----------------------------
      // PAYMENTS / TRANSACTIONS
      // -----------------------------

      if (results[3].status === "fulfilled") {
        const data = results[3].value;
        setPayments(
          Array.isArray(data)
            ? data
            : Array.isArray(data.payments)
              ? data.payments
              : [],
        );
      }

      if (results[4].status === "fulfilled") {
        const data = results[4].value;
        setRecentUserActivity(
          Array.isArray(data)
            ? data
            : Array.isArray(data.activities)
              ? data.activities
              : [],
        );
        setActivityError("");
      } else {
        setActivityError(results[4].reason?.message || "Unable to load recent activity.");
      }

      // If every request failed, show the error.
      const allFailed = results.every((result) => result.status === "rejected");

      if (allFailed) {
        throw results[0].reason;
      }
    } catch (err) {
      console.error("Admin dashboard error:", err);
      setError(err.message || "Unable to load admin dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadUsageAnalytics = async () => {
    try {
      setUsageLoading(true); setUsageError("");
      const data = await adminFetch("/api/admin/usage-analytics");
      setUsageAnalytics({ users: Array.isArray(data?.users) ? data.users : [], sessions: Array.isArray(data?.sessions) ? data.sessions : [], books: Array.isArray(data?.books) ? data.books : [], pages: Array.isArray(data?.pages) ? data.pages : [] });
    } catch (err) { setUsageError(err.message || "Unable to load usage analytics."); }
    finally { setUsageLoading(false); }
  };
  useEffect(() => { if (activeTab === "user-log") loadUsageAnalytics(); }, [activeTab]);
  const formatDuration = (seconds) => { const total = Math.max(0, Number(seconds || 0)); const m = Math.floor(total / 60); const s = Math.floor(total % 60); if (m >= 60) return `${Math.floor(m/60)}h ${m%60}m ${s}s`; return m ? `${m}m ${s}s` : `${s}s`; };
  const usageRows = useMemo(() => {
    const byUser = new Map();
    for (const row of usageAnalytics.users) byUser.set(Number(row.id), { ...row, dashboard_seconds: 0, favorites_seconds: 0, comments_seconds: 0, book_seconds: 0 });
    for (const session of usageAnalytics.sessions) { const row = byUser.get(Number(session.user_id)); if (!row) continue; const sec = Number(session.duration_seconds || 0); if (session.activity_type === "page" && (session.resource_key === "dashboard" || session.resource_name === "Dashboard")) row.dashboard_seconds += sec; else if (session.activity_type === "favorites") row.favorites_seconds += sec; else if (session.activity_type === "comments") row.comments_seconds += sec; else if (session.activity_type === "book") row.book_seconds += sec; }
    return Array.from(byUser.values()).filter((row) => !usageUserFilter || String(row.id) === usageUserFilter);
  }, [usageAnalytics, usageUserFilter]);

  // ------------------------------------------------------
  // OPEN DETAIL DRILL-DOWN (Comments / Favorites / Ratings)
  // ------------------------------------------------------
  //
  // Called when the admin clicks the corresponding stat
  // card on the Overview page. Fetches every record of that
  // type from the new /api/admin/<type> endpoints, each of
  // which already comes joined with the book title and the
  // user who left it.

  const detailEndpoints = {
    comments: { path: "/api/admin/comments", key: "comments" },
    favorites: { path: "/api/admin/favorites", key: "favorites" },
    ratings: { path: "/api/admin/ratings", key: "ratings" },
  };

  const openDetail = async (type) => {
    const config = detailEndpoints[type];
    if (!config) return;

    setDetailType(type);
    setDetailItems([]);
    setDetailError("");
    setDetailLoading(true);

    try {
      const data = await adminFetch(config.path);

      const items = Array.isArray(data)
        ? data
        : Array.isArray(data[config.key])
          ? data[config.key]
          : [];

      setDetailItems(items);
    } catch (err) {
      console.error(`Load admin ${type} error:`, err);
      setDetailError(err.message || `Failed to load ${type}.`);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetailType(null);
    setDetailItems([]);
    setDetailError("");
  };

  // ------------------------------------------------------
  // OPEN "ADD BOOK" FORM
  // ------------------------------------------------------

  const openAddBookForm = () => {
    setEditingBookId(null);
    setBookForm(emptyBookForm);
    setBookFormError("");
    setShowBookForm(true);
  };

  // ------------------------------------------------------
  // OPEN "EDIT BOOK" FORM
  // ------------------------------------------------------

  const openEditBookForm = (book) => {
    setEditingBookId(book.id);

    setBookForm({
      title: book.title || "",
      author: book.author || "",
      description: book.description || "",
      cover_url: book.cover_url || "",
      published_year: book.published_year || "",
      price_npr: book.price_npr ?? "",
      sale_price_npr: book.sale_price_npr ?? "",
      is_for_sale: book.is_for_sale !== false,
    });

    setBookFormError("");
    setShowBookForm(true);
  };

  // ------------------------------------------------------
  // CLOSE THE FORM
  // ------------------------------------------------------

  const closeBookForm = () => {
    setShowBookForm(false);
    setEditingBookId(null);
    setBookForm(emptyBookForm);
    setBookFormError("");
  };

  // ------------------------------------------------------
  // SAVE BOOK (ADD OR EDIT)
  // ------------------------------------------------------

  const handleSaveBook = async (event) => {
    event.preventDefault();

    if (!bookForm.title.trim() || !bookForm.author.trim()) {
      setBookFormError("Title and author are required.");
      return;
    }

    try {
      setSavingBook(true);
      setBookFormError("");

      const payload = {
        title: bookForm.title.trim(),
        author: bookForm.author.trim(),
        description: bookForm.description.trim(),
        cover_url: bookForm.cover_url.trim() || null,
        published_year: bookForm.published_year
          ? Number(bookForm.published_year)
          : null,
        price_npr: bookForm.price_npr !== "" ? Number(bookForm.price_npr) : 0,
        sale_price_npr:
          bookForm.sale_price_npr !== "" ? Number(bookForm.sale_price_npr) : null,
        is_for_sale: Boolean(bookForm.is_for_sale),
      };

      const endpoint = editingBookId
        ? `/api/admin/books/${editingBookId}`
        : "/api/admin/books";

      const data = await adminFetch(endpoint, {
        method: editingBookId ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });

      if (editingBookId) {
        // Replace the updated book in place.
        setBooks((previous) =>
          previous.map((book) =>
            book.id === editingBookId ? data.book : book,
          ),
        );
      } else {
        // Add the new book to the top of the list.
        setBooks((previous) => [data.book, ...previous]);

        setStats((previous) => ({
          ...previous,
          books: previous.books + 1,
        }));
      }

      closeBookForm();
    } catch (err) {
      console.error("Save book error:", err);
      setBookFormError(err.message || "Failed to save book.");
    } finally {
      setSavingBook(false);
    }
  };

  // ------------------------------------------------------
  // DELETE BOOK
  // ------------------------------------------------------

  const handleDeleteBook = async (book) => {
    const confirmed = window.confirm(
      `Delete "${book.title}"? This cannot be undone.`,
    );

    if (!confirmed) return;

    try {
      setDeletingBookId(book.id);

      await adminFetch(`/api/admin/books/${book.id}`, {
        method: "DELETE",
      });

      setBooks((previous) => previous.filter((item) => item.id !== book.id));

      setStats((previous) => ({
        ...previous,
        books: Math.max(0, previous.books - 1),
      }));
    } catch (err) {
      console.error("Delete book error:", err);
      alert(err.message || "Failed to delete book.");
    } finally {
      setDeletingBookId(null);
    }
  };

  // ------------------------------------------------------
  // PAYMENT MANAGEMENT
  // ------------------------------------------------------

  const loadPayments = async (status = paymentFilter) => {
    try {
      setPaymentLoading(true);
      setPaymentError("");

      const suffix = status && status !== "all" ? `?status=${encodeURIComponent(status)}` : "";
      const data = await adminFetch(`/api/admin/payments${suffix}`);
      const items = Array.isArray(data)
        ? data
        : Array.isArray(data.payments)
          ? data.payments
          : [];

      setPayments(items);
    } catch (err) {
      console.error("Load admin payments error:", err);
      setPaymentError(err.message || "Failed to load payment transactions.");
    } finally {
      setPaymentLoading(false);
    }
  };

  const handlePaymentFilter = async (status) => {
    setPaymentFilter(status);
    await loadPayments(status);
  };

  const verifyManualPayment = async (payment) => {
    const confirmed = window.confirm(
      `Verify payment #${payment.id} for ${payment.order_number}? This will mark the order as paid and clear the customer's cart.`,
    );

    if (!confirmed) return;

    try {
      setVerifyingPaymentId(payment.id);
      const data = await adminFetch(`/api/admin/payments/${payment.id}/verify`, {
        method: "POST",
        body: JSON.stringify({}),
      });

      alert(data.message || "Payment verified successfully.");
      await loadPayments(paymentFilter);
    } catch (err) {
      console.error("Verify payment error:", err);
      alert(err.message || "Failed to verify payment.");
    } finally {
      setVerifyingPaymentId(null);
    }
  };

  const formatAdminDateTime = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const openUserActivity = async (item) => {
    if (!item?.id) return;
    setSelectedActivityUser(item);
    setUserActivity(null);
    setUserActivityError('');
    setUserActivityLoading(true);
    try {
      const data = await adminFetch(`/api/admin/users/${item.id}/activity`);
      setUserActivity(data);
    } catch (err) {
      setUserActivityError(err.message || 'Unable to load user activity.');
    } finally {
      setUserActivityLoading(false);
    }
  };

  const paymentSummary = useMemo(() => {
    const summary = { pending: 0, completed: 0, failed: 0, total: 0, paidAmount: 0, pendingAmount: 0 };
    for (const payment of payments) {
      const amount = Number(payment.amount || 0);
      summary.total += 1;
      if (payment.payment_status === "completed" || payment.order_status === "paid") {
        summary.completed += 1;
        summary.paidAmount += amount;
      } else if (["pending", "initiated"].includes(payment.payment_status)) {
        summary.pending += 1;
        summary.pendingAmount += amount;
      } else if (["failed", "canceled", "expired", "refunded"].includes(payment.payment_status)) {
        summary.failed += 1;
      }
    }
    return summary;
  }, [payments]);

  const loadSupportConversations = async () => {
    try {
      const data = await adminFetch("/api/admin/support/conversations");
      setSupportConversations(Array.isArray(data.conversations) ? data.conversations : []);
      setSupportError("");
    } catch (err) {
      setSupportError(err.message || "Unable to load support inbox.");
    }
  };

  const openSupportConversation = async (conversation) => {
    setSupportConversation(conversation);
    setSupportLoading(true);
    setSupportError("");
    try {
      const data = await adminFetch(`/api/admin/support/conversations/${conversation.id}`);
      setSupportMessages(Array.isArray(data.messages) ? data.messages : []);
      setSupportConversations((items) => items.map((item) => item.id === conversation.id ? { ...item, unread_count: 0 } : item));
    } catch (err) {
      setSupportError(err.message || "Unable to load conversation.");
    } finally {
      setSupportLoading(false);
    }
  };

  const replyToSupport = async () => {
    const message = supportDraft.trim();
    if (!supportConversation || !message) return;
    try {
      setSupportLoading(true);
      const data = await adminFetch(`/api/admin/support/conversations/${supportConversation.id}/messages`, {
        method: "POST",
        body: JSON.stringify({ message }),
      });
      setSupportMessages((items) => [...items, data.message]);
      setSupportDraft("");
      await loadSupportConversations();
    } catch (err) {
      setSupportError(err.message || "Unable to send reply.");
    } finally {
      setSupportLoading(false);
    }
  };

  const generateAdminInvite = async () => {
    try {
      setInviteLoading(true);
      const data = await adminFetch("/api/admin/invite-codes", { method: "POST" });
      setInviteCode(data.code || "");
      setInviteExpires(`${data.expiresInMinutes || 10} minutes`);
    } catch (err) {
      setError(err.message || "Unable to generate invite code.");
    } finally {
      setInviteLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "support") {
      loadSupportConversations();
      const timer = setInterval(loadSupportConversations, 2500);
      return () => clearInterval(timer);
    }
    return undefined;
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "support" || !supportConversation) return undefined;
    const loadSelected = async () => {
      try {
        const data = await adminFetch(`/api/admin/support/conversations/${supportConversation.id}`);
        setSupportMessages(Array.isArray(data.messages) ? data.messages : []);
      } catch {}
    };
    const timer = setInterval(loadSelected, 2500);
    return () => clearInterval(timer);
  }, [activeTab, supportConversation?.id]);

  // ------------------------------------------------------
  // ADMIN SECURITY CHECK
  // ------------------------------------------------------

  if (!user || user.role !== "admin") {
    return (
      <div className="admin-denied">
        <div className="admin-denied-card">
          <div className="admin-denied-icon">🔒</div>

          <h1>Access Denied</h1>

          <p>This area is restricted to BookWise administrators.</p>

          <button
            type="button"
            onClick={onBackToBookWise}
            className="admin-primary-btn"
          >
            Back to BookWise
          </button>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------
  // FORMAT DATE
  // ------------------------------------------------------

  const formatAdminDate = (value) => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // ------------------------------------------------------
  // RENDER
  // ------------------------------------------------------

  return (
    <div className="admin-dashboard">
      {/* ================================================
          SIDEBAR
      ================================================= */}

      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-brand-icon">📚</div>

          <div>
            <strong>BookWise</strong>
            <span>Admin Panel</span>
          </div>
        </div>

        <div className="admin-profile">
          <div className="admin-avatar">
            {(user.name || "A").charAt(0).toUpperCase()}
          </div>

          <div>
            <strong>{user.name || "Administrator"}</strong>
            <span>{user.email}</span>

            <small>ADMINISTRATOR</small>
          </div>
        </div>

        <nav className="admin-nav">
          <button
            type="button"
            className={
              activeTab === "overview"
                ? "admin-nav-item active"
                : "admin-nav-item"
            }
            onClick={() => setActiveTab("overview")}
          >
            <span>📊</span>
            Overview
          </button>

          <button
            type="button"
            className={
              activeTab === "users" ? "admin-nav-item active" : "admin-nav-item"
            }
            onClick={() => setActiveTab("users")}
          >
            <span>👥</span>
            Users
          </button>

          <button
            type="button"
            className={
              activeTab === "books" ? "admin-nav-item active" : "admin-nav-item"
            }
            onClick={() => setActiveTab("books")}
          >
            <span>📚</span>
            Books
          </button>

          <button
            type="button"
            className={
              activeTab === "payments"
                ? "admin-nav-item active"
                : "admin-nav-item"
            }
            onClick={() => {
              setActiveTab("payments");
              loadPayments("all");
            }}
          >
            <span>💳</span>
            Payments
          </button>

          <button type="button" className={activeTab === "support" ? "admin-nav-item active" : "admin-nav-item"} onClick={() => setActiveTab("support")}>
            <span>💬</span>
            Support {supportConversations.reduce((sum, item) => sum + Number(item.unread_count || 0), 0) > 0 ? `(${supportConversations.reduce((sum, item) => sum + Number(item.unread_count || 0), 0)})` : ""}
          </button>

          <button type="button" className={activeTab === "team" ? "admin-nav-item active" : "admin-nav-item"} onClick={() => setActiveTab("team")}>
            <span>🛡️</span>
            Admin Team
          </button>

          <button
            type="button"
            className={
              activeTab === "activity"
                ? "admin-nav-item active"
                : "admin-nav-item"
            }
            onClick={() => setActiveTab("activity")}
          >
            <span>⚡</span>
            Activity
          </button>

          <button type="button" className={activeTab === "user-log" ? "admin-nav-item active" : "admin-nav-item"} onClick={() => setActiveTab("user-log")}>
            <span>🕒</span>
            User Log (Activity)
          </button>
        </nav>

        <div className="admin-sidebar-bottom">
          <button
            type="button"
            className="admin-back-btn"
            onClick={onBackToBookWise}
          >
            ← BookWise
          </button>

          <button type="button" className="admin-logout-btn" onClick={onLogout}>
            ⇥ Logout
          </button>
        </div>
      </aside>

      {/* ================================================
          MAIN AREA
      ================================================= */}

      <main className="admin-main">
        {/* HEADER */}

        <header className="admin-header">
          <div>
            <span className="admin-eyebrow">ADMINISTRATION</span>

            <h1>
              {activeTab === "overview" && "Dashboard Overview"}
              {activeTab === "users" && "User Management"}
              {activeTab === "books" && "Book Management"}
              {activeTab === "payments" && "Payment Transactions"}
              {activeTab === "support" && "Customer Support"}
              {activeTab === "team" && "Administrator Access"}
              {activeTab === "activity" && "Recent Activity"}
              {activeTab === "user-log" && "User Log (Activity)"}
            </h1>

            <p>Manage your BookWise platform from one place.</p>
          </div>

          <div className="admin-header-actions">
            <button
              type="button"
              className="admin-refresh-btn"
              onClick={loadAdminData}
              disabled={loading}
            >
              ↻ {loading ? "Refreshing..." : "Refresh"}
            </button>

            <div className="admin-status">
              <span className="admin-status-dot"></span>
              System Online
            </div>
          </div>
        </header>

        {error && (
          <div className="admin-error">
            <strong>Unable to load some dashboard data.</strong>
            <span>{error}</span>

            <button type="button" onClick={loadAdminData}>
              Retry
            </button>
          </div>
        )}

        {/* ================================================
            OVERVIEW
        ================================================= */}

        {activeTab === "overview" && (
          <>
            <section className="admin-welcome-card">
              <div>
                <span>WELCOME BACK 👋</span>

                <h2>Hello, {user.name || "Administrator"}</h2>

                <p>
                  Here's what's happening across your BookWise platform today.
                </p>
              </div>

              <div className="admin-welcome-icon">📚</div>
            </section>

            {/* STAT CARDS */}

            <section className="admin-stat-grid">
              <div
                className="admin-stat-card admin-stat-card-clickable"
                role="button"
                tabIndex={0}
                title="View all users"
                onClick={() => setActiveTab("users")}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setActiveTab("users");
                  }
                }}
                style={{ cursor: "pointer" }}
              >
                <div className="admin-stat-icon blue">👥</div>

                <div>
                  <span>Total Users</span>

                  <strong>
                    {loading ? "—" : stats.users.toLocaleString()}
                  </strong>

                  <small>Registered accounts</small>
                </div>
              </div>

              <div
                className="admin-stat-card admin-stat-card-clickable"
                role="button"
                tabIndex={0}
                title="View all books"
                onClick={() => setActiveTab("books")}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setActiveTab("books");
                  }
                }}
                style={{ cursor: "pointer" }}
              >
                <div className="admin-stat-icon purple">📚</div>

                <div>
                  <span>Total Books</span>

                  <strong>
                    {loading ? "—" : stats.books.toLocaleString()}
                  </strong>

                  <small>Books in library</small>
                </div>
              </div>

              <div
                className="admin-stat-card admin-stat-card-clickable"
                role="button"
                tabIndex={0}
                title="View who favorited which book"
                onClick={() => openDetail("favorites")}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openDetail("favorites");
                  }
                }}
                style={{ cursor: "pointer" }}
              >
                <div className="admin-stat-icon pink">♥</div>

                <div>
                  <span>Favorites</span>

                  <strong>
                    {loading ? "—" : stats.favorites.toLocaleString()}
                  </strong>

                  <small>User saved books</small>
                </div>
              </div>

              <div
                className="admin-stat-card admin-stat-card-clickable"
                role="button"
                tabIndex={0}
                title="View every rating and which book it's for"
                onClick={() => openDetail("ratings")}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openDetail("ratings");
                  }
                }}
                style={{ cursor: "pointer" }}
              >
                <div className="admin-stat-icon yellow">⭐</div>

                <div>
                  <span>Ratings</span>

                  <strong>
                    {loading ? "—" : stats.ratings.toLocaleString()}
                  </strong>

                  <small>Star ratings given</small>
                </div>
              </div>

              <div
                className="admin-stat-card admin-stat-card-clickable"
                role="button"
                tabIndex={0}
                title="View every comment and which book it's on"
                onClick={() => openDetail("comments")}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openDetail("comments");
                  }
                }}
                style={{ cursor: "pointer" }}
              >
                <div className="admin-stat-icon orange">💬</div>

                <div>
                  <span>Comments</span>

                  <strong>
                    {loading ? "—" : stats.comments.toLocaleString()}
                  </strong>

                  <small>Reviews & discussions</small>
                </div>
              </div>
            </section>

            {/* QUICK ACTIONS */}

            <section className="admin-section">
              <div className="admin-section-header">
                <div>
                  <span className="admin-eyebrow">MANAGEMENT</span>

                  <h2>Quick Actions</h2>
                </div>
              </div>

              <div className="admin-quick-grid">
                <button
                  type="button"
                  onClick={() => setActiveTab("users")}
                  className="admin-quick-card"
                >
                  <div>👥</div>
                  <strong>Manage Users</strong>
                  <span>View registered users</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("books")}
                  className="admin-quick-card"
                >
                  <div>📚</div>
                  <strong>Manage Books</strong>
                  <span>View your book catalog</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("payments");
                    loadPayments("all");
                  }}
                  className="admin-quick-card"
                >
                  <div>💳</div>
                  <strong>Payment Transactions</strong>
                  <span>Review pending and completed payments</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("activity")}
                  className="admin-quick-card"
                >
                  <div>⚡</div>
                  <strong>Recent Activity</strong>
                  <span>Monitor platform activity</span>
                </button>
              </div>
            </section>

            {/* RECENT USERS */}

            <section className="admin-section">
              <div className="admin-section-header">
                <div>
                  <span className="admin-eyebrow">USERS</span>

                  <h2>Recent Users</h2>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab("users")}
                  className="admin-text-btn"
                >
                  View All →
                </button>
              </div>

              <div className="admin-table-wrapper">
                {users.length === 0 ? (
                  <div className="admin-empty">
                    <div>👥</div>
                    <h3>No users available</h3>
                    <p>User data will appear here.</p>
                  </div>
                ) : (
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Joined</th>
                      </tr>
                    </thead>

                    <tbody>
                      {users.slice(0, 5).map((item, index) => (
                        <tr key={item.id || index}>
                          <td>
                            <div className="admin-user-cell">
                              <div className="admin-mini-avatar">
                                {(item.name || "U").charAt(0).toUpperCase()}
                              </div>

                              <strong>{item.name || "Unknown User"}</strong>
                            </div>
                          </td>

                          <td>{item.email || "—"}</td>

                          <td>
                            <span
                              className={
                                item.role === "admin"
                                  ? "admin-role admin-role-admin"
                                  : "admin-role"
                              }
                            >
                              {item.role || "user"}
                            </span>
                          </td>

                          <td>
                            {formatAdminDate(item.created_at || item.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          </>
        )}

        {/* ================================================
            USERS
        ================================================= */}

        {activeTab === "users" && (
          <section className="admin-section">
            <div className="admin-section-header">
              <div>
                <span className="admin-eyebrow">ACCOUNTS</span>

                <h2>All Users</h2>

                <p>{users.length} users loaded</p>
              </div>
            </div>

            <div className="admin-table-wrapper">
              {users.length === 0 ? (
                <div className="admin-empty">
                  <div>👥</div>
                  <h3>No users found</h3>
                </div>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Logins</th>
                      <th>Comments</th>
                      <th>Ratings</th>
                      <th>Last Login</th>
                      <th>Activity</th>
                      <th>Joined</th>
                    </tr>
                  </thead>

                  <tbody>
                    {users.map((item, index) => (
                      <tr key={item.id || index}>
                        <td>
                          <div className="admin-user-cell">
                            <div className="admin-mini-avatar">
                              {(item.name || "U").charAt(0).toUpperCase()}
                            </div>

                            <strong>{item.name || "Unknown"}</strong>
                          </div>
                        </td>

                        <td>{item.email || "—"}</td>

                        <td>
                          <span
                            className={
                              item.role === "admin"
                                ? "admin-role admin-role-admin"
                                : "admin-role"
                            }
                          >
                            {item.role || "user"}
                          </span>
                        </td>

                        <td>{Number(item.login_count || 0)}</td>
                        <td>{Number(item.comment_count || 0)}</td>
                        <td>{Number(item.rating_count || 0)}</td>
                        <td>{item.last_login ? formatAdminDate(item.last_login) : 'Never'}</td>
                        <td>
                          <button type="button" onClick={() => openUserActivity(item)} style={{ padding: '7px 10px', borderRadius: 7, border: '1px solid #c7d2fe', background: '#eef2ff', color: '#4338ca', fontWeight: 700, cursor: 'pointer' }}>View log</button>
                        </td>
                        <td>
                          {formatAdminDate(item.created_at || item.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        )}

        {/* ================================================
            BOOKS
        ================================================= */}

        {activeTab === "books" && (
          <section className="admin-section">
            <div className="admin-section-header">
              <div>
                <span className="admin-eyebrow">LIBRARY</span>

                <h2>Book Catalog</h2>

                <p>{books.length} books loaded</p>
              </div>

              <button
                type="button"
                onClick={openAddBookForm}
                style={{
                  padding: "10px 18px",
                  borderRadius: 8,
                  border: "none",
                  background: "#4f46e5",
                  color: "#fff",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                + Add Book
              </button>
            </div>

            <div className="admin-book-grid">
              {books.length === 0 ? (
                <div className="admin-empty">
                  <div>📚</div>
                  <h3>No books available</h3>
                </div>
              ) : (
                books.map((book, index) => (
                  <article className="admin-book-card" key={book.id || index}>
                    <div className="admin-book-cover">
                      <img
                        src={
                          book.cover_url ||
                          "https://via.placeholder.com/160x230?text=Book"
                        }
                        alt={book.title || "Book"}
                        onError={(event) => {
                          event.currentTarget.src =
                            "https://via.placeholder.com/160x230?text=Book";
                        }}
                      />
                    </div>

                    <div className="admin-book-info">
                      <h3>{book.title || "Untitled Book"}</h3>

                      <p>{book.author || "Unknown Author"}</p>

                      <span>
                        ⭐{" "}
                        {book.average_rating
                          ? Number(book.average_rating).toFixed(1)
                          : "0.0"}
                      </span> 
                      <strong style={{ display: "block", marginTop: 6 }}>
                        {book.is_for_sale
                          ? `NPR ${Number(book.sale_price_npr ?? book.price_npr ?? 0).toLocaleString()}`
                          : "Not for sale"}
                      </strong>

                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          marginTop: 10,
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => openEditBookForm(book)}
                          style={{
                            flex: 1,
                            padding: "6px 10px",
                            borderRadius: 6,
                            border: "1px solid #d1d5db",
                            background: "#fff",
                            cursor: "pointer",
                            fontSize: 13,
                            fontWeight: 600,
                          }}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteBook(book)}
                          disabled={deletingBookId === book.id}
                          style={{
                            flex: 1,
                            padding: "6px 10px",
                            borderRadius: 6,
                            border: "1px solid #fca5a5",
                            background: "#fef2f2",
                            color: "#b91c1c",
                            cursor: "pointer",
                            fontSize: 13,
                            fontWeight: 600,
                          }}
                        >
                          {deletingBookId === book.id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        )}

        {/* ================================================
            ADD / EDIT BOOK MODAL
        ================================================= */}

        {showBookForm && (
          <div
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                closeBookForm();
              }
            }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 1000,
              background: "rgba(15, 23, 42, 0.55)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 20,
            }}
          >
            <div
              style={{
                width: "min(480px, 100%)",
                background: "#fff",
                borderRadius: 12,
                padding: 24,
                maxHeight: "90vh",
                overflowY: "auto",
              }}
            >
              <h2 style={{ marginTop: 0 }}>
                {editingBookId ? "Edit Book" : "Add New Book"}
              </h2>

              {bookFormError && (
                <div
                  style={{
                    background: "#fef2f2",
                    color: "#b91c1c",
                    padding: "10px 12px",
                    borderRadius: 8,
                    marginBottom: 14,
                    fontSize: 14,
                  }}
                >
                  {bookFormError}
                </div>
              )}

              <form onSubmit={handleSaveBook}>
                <div style={{ marginBottom: 12 }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: 4,
                      fontWeight: 600,
                      fontSize: 14,
                    }}
                  >
                    Title *
                  </label>
                  <input
                    type="text"
                    value={bookForm.title}
                    onChange={(event) =>
                      setBookForm((previous) => ({
                        ...previous,
                        title: event.target.value,
                      }))
                    }
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: 6,
                      border: "1px solid #d1d5db",
                      boxSizing: "border-box",
                    }}
                    required
                  />
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: 4,
                      fontWeight: 600,
                      fontSize: 14,
                    }}
                  >
                    Author *
                  </label>
                  <input
                    type="text"
                    value={bookForm.author}
                    onChange={(event) =>
                      setBookForm((previous) => ({
                        ...previous,
                        author: event.target.value,
                      }))
                    }
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: 6,
                      border: "1px solid #d1d5db",
                      boxSizing: "border-box",
                    }}
                    required
                  />
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: 4,
                      fontWeight: 600,
                      fontSize: 14,
                    }}
                  >
                    Description
                  </label>
                  <textarea
                    value={bookForm.description}
                    onChange={(event) =>
                      setBookForm((previous) => ({
                        ...previous,
                        description: event.target.value,
                      }))
                    }
                    rows={3}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: 6,
                      border: "1px solid #d1d5db",
                      boxSizing: "border-box",
                      resize: "vertical",
                    }}
                  />
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: 4,
                      fontWeight: 600,
                      fontSize: 14,
                    }}
                  >
                    Cover Image URL
                  </label>
                  <input
                    type="text"
                    value={bookForm.cover_url}
                    onChange={(event) =>
                      setBookForm((previous) => ({
                        ...previous,
                        cover_url: event.target.value,
                      }))
                    }
                    placeholder="https://..."
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: 6,
                      border: "1px solid #d1d5db",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                  <div>
                    <label style={{ display: "block", marginBottom: 4, fontWeight: 600, fontSize: 14 }}>
                      Price (NPR) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={bookForm.price_npr}
                      onChange={(event) =>
                        setBookForm((previous) => ({
                          ...previous,
                          price_npr: event.target.value,
                        }))
                      }
                      required
                      style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #d1d5db", boxSizing: "border-box" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 4, fontWeight: 600, fontSize: 14 }}>
                      Sale Price
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={bookForm.sale_price_npr}
                      onChange={(event) =>
                        setBookForm((previous) => ({
                          ...previous,
                          sale_price_npr: event.target.value,
                        }))
                      }
                      style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #d1d5db", boxSizing: "border-box" }}
                    />
                  </div>
                </div>

                <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, fontWeight: 600, fontSize: 14 }}>
                  <input
                    type="checkbox"
                    checked={bookForm.is_for_sale}
                    onChange={(event) =>
                      setBookForm((previous) => ({
                        ...previous,
                        is_for_sale: event.target.checked,
                      }))
                    }
                  />
                  Available for purchase
                </label>

                <div style={{ marginBottom: 20 }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: 4,
                      fontWeight: 600,
                      fontSize: 14,
                    }}
                  >
                    Published Year
                  </label>
                  <input
                    type="number"
                    value={bookForm.published_year}
                    onChange={(event) =>
                      setBookForm((previous) => ({
                        ...previous,
                        published_year: event.target.value,
                      }))
                    }
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: 6,
                      border: "1px solid #d1d5db",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    type="button"
                    onClick={closeBookForm}
                    disabled={savingBook}
                    style={{
                      flex: 1,
                      padding: "10px 0",
                      borderRadius: 8,
                      border: "1px solid #d1d5db",
                      background: "#fff",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={savingBook}
                    style={{
                      flex: 1,
                      padding: "10px 0",
                      borderRadius: 8,
                      border: "none",
                      background: "#4f46e5",
                      color: "#fff",
                      cursor: "pointer",
                      fontWeight: 700,
                    }}
                  >
                    {savingBook
                      ? "Saving..."
                      : editingBookId
                        ? "Save Changes"
                        : "Add Book"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================================================
            PAYMENTS / TRANSACTIONS
        ================================================= */}

        {activeTab === "payments" && (
          <section className="admin-section">
            <div className="admin-section-header">
              <div>
                <span className="admin-eyebrow">COMMERCE</span>
                <h2>Payment Transactions</h2>
                <p>Monitor eSewa, bank transfer, BTC and USDT payments.</p>
              </div>
              <button
                type="button"
                className="admin-refresh-btn"
                onClick={() => loadPayments(paymentFilter)}
                disabled={paymentLoading}
              >
                ↻ {paymentLoading ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            {paymentError && (
              <div className="admin-error">
                <strong>Unable to load payment transactions.</strong>
                <span>{paymentError}</span>
              </div>
            )}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                gap: 14,
                marginBottom: 20,
              }}
            >
              {[
                ["Pending", paymentSummary.pending, `NPR ${paymentSummary.pendingAmount.toLocaleString()}`],
                ["Completed", paymentSummary.completed, `NPR ${paymentSummary.paidAmount.toLocaleString()}`],
                ["Other", paymentSummary.failed, "Failed / canceled"],
                ["Transactions", paymentSummary.total, "All loaded records"],
              ].map(([label, value, note]) => (
                <div
                  key={label}
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: 14,
                    padding: "16px 18px",
                  }}
                >
                  <div style={{ color: "#64748b", fontSize: 13, fontWeight: 700 }}>{label}</div>
                  <div style={{ fontSize: 27, fontWeight: 800, color: "#17233d", marginTop: 4 }}>{value}</div>
                  <div style={{ color: "#64748b", fontSize: 12, marginTop: 3 }}>{note}</div>
                </div>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                marginBottom: 16,
              }}
            >
              {["all", "pending", "completed", "failed"].map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => handlePaymentFilter(filter)}
                  style={{
                    border: "1px solid #dbe2ea",
                    background: paymentFilter === filter ? "#4f46e5" : "#fff",
                    color: paymentFilter === filter ? "#fff" : "#334155",
                    borderRadius: 999,
                    padding: "8px 14px",
                    fontWeight: 700,
                    cursor: "pointer",
                    textTransform: "capitalize",
                  }}
                >
                  {filter === "all" ? "All" : filter}
                </button>
              ))}
            </div>

            {paymentLoading ? (
              <div className="admin-empty">
                <div>💳</div>
                <h3>Loading transactions...</h3>
              </div>
            ) : payments.length === 0 ? (
              <div className="admin-empty">
                <div>💳</div>
                <h3>No payment transactions found</h3>
                <p>Transactions will appear here when customers start checking out.</p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Customer</th>
                      <th>Method</th>
                      <th>Amount</th>
                      <th>Payment Status</th>
                      <th>Transaction / Reference</th>
                      <th>Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => {
                      const isPaid = payment.payment_status === "completed" || payment.order_status === "paid";
                      const isPending = ["pending", "initiated"].includes(payment.payment_status) && !isPaid;
                      const providerLabel = String(payment.provider || "unknown").toUpperCase();

                      return (
                        <tr key={payment.id}>
                          <td>
                            <strong>{payment.order_number || `#${payment.order_id}`}</strong>
                            <div style={{ color: "#64748b", fontSize: 12 }}>Payment #{payment.id}</div>
                          </td>
                          <td>
                            <strong>{payment.user_name || "Unknown"}</strong>
                            <div style={{ color: "#64748b", fontSize: 12 }}>{payment.user_email || "—"}</div>
                          </td>
                          <td>
                            <span style={{ fontWeight: 800 }}>{providerLabel}</span>
                          </td>
                          <td>
                            <strong>NPR {Number(payment.amount || 0).toLocaleString()}</strong>
                          </td>
                          <td>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                borderRadius: 999,
                                padding: "6px 10px",
                                fontSize: 12,
                                fontWeight: 800,
                                background: isPaid ? "#dcfce7" : isPending ? "#fef3c7" : "#fee2e2",
                                color: isPaid ? "#166534" : isPending ? "#92400e" : "#991b1b",
                              }}
                            >
                              {isPaid ? "PAID" : String(payment.payment_status || "UNKNOWN").toUpperCase()}
                            </span>
                          </td>
                          <td style={{ minWidth: 190 }}>
                            <div style={{ fontSize: 12, wordBreak: "break-word" }}>
                              {payment.transaction_id || "No transaction ID"}
                            </div>
                            <div style={{ color: "#64748b", fontSize: 11, wordBreak: "break-word", marginTop: 4 }}>
                              {payment.provider_reference || "No provider reference"}
                            </div>
                          </td>
                          <td>{formatAdminDateTime(payment.payment_created_at)}</td>
                          <td>
                            {isPending && ["bank", "btc", "usdt"].includes(String(payment.provider).toLowerCase()) ? (
                              <button
                                type="button"
                                onClick={() => verifyManualPayment(payment)}
                                disabled={verifyingPaymentId === payment.id}
                                style={{
                                  border: "none",
                                  background: "#16a34a",
                                  color: "#fff",
                                  borderRadius: 8,
                                  padding: "8px 11px",
                                  fontWeight: 800,
                                  cursor: verifyingPaymentId === payment.id ? "wait" : "pointer",
                                }}
                              >
                                {verifyingPaymentId === payment.id ? "Verifying..." : "Verify & Pay"}
                              </button>
                            ) : (
                              <span style={{ color: "#94a3b8", fontSize: 12 }}>No action</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {selectedActivityUser && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(15,23,42,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onMouseDown={(e) => { if (e.target === e.currentTarget) setSelectedActivityUser(null); }}>
            <div style={{ width: 'min(1100px, 96vw)', maxHeight: '90vh', overflow: 'auto', background: '#fff', borderRadius: 18, padding: 24, boxShadow: '0 25px 70px rgba(0,0,0,.25)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }}>
                <div><span className="admin-eyebrow">USER AUDIT LOG</span><h2 style={{ margin: '5px 0' }}>{userActivity?.user?.name || selectedActivityUser.name || 'User'}</h2><p style={{ margin: 0 }}>{userActivity?.user?.email || selectedActivityUser.email || '—'}</p></div>
                <button type="button" onClick={() => setSelectedActivityUser(null)} style={{ border: 'none', background: '#eef2f7', borderRadius: 9, padding: '8px 12px', cursor: 'pointer' }}>✕</button>
              </div>
              {userActivityLoading && <p style={{ marginTop: 20 }}>Loading complete activity log...</p>}
              {userActivityError && <div className="admin-error" style={{ marginTop: 16 }}>{userActivityError}</div>}
              {userActivity && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 10, margin: '20px 0' }}>
                    {[["Logins",userActivity.summary?.login_count],["Comments",userActivity.summary?.comment_count],["Ratings",userActivity.summary?.rating_count],["Favorites",userActivity.summary?.favorite_count],["Total events",userActivity.summary?.total_events]].map(([label,value]) => <div key={label} style={{ padding: 14, border: '1px solid #e5e7eb', borderRadius: 12 }}><strong style={{ display:'block', fontSize: 22 }}>{Number(value || 0)}</strong><span>{label}</span></div>)}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10, margin: "16px 0" }}>
                    {(userActivity.usage || []).map((item) => (
                      <div key={item.activity_type} style={{ padding: 14, border: "1px solid #e5e7eb", borderRadius: 12, background: "#f8fafc" }}>
                        <small style={{ color: "#64748b", textTransform: "capitalize" }}>{item.activity_type.replaceAll("_", " ")}</small>
                        <strong style={{ display: "block", fontSize: 20, marginTop: 4 }}>{formatDuration(item.total_seconds)}</strong>
                        <span style={{ color: "#64748b", fontSize: 12 }}>{item.sessions} session(s)</span>
                      </div>
                    ))}
                  </div>
                  <h3 style={{ margin: "18px 0 10px" }}>Usage Sessions</h3>
                  <div className="admin-table-wrapper"><table className="admin-table"><thead><tr><th>Started</th><th>Area</th><th>Resource</th><th>Duration</th><th>Last Seen</th></tr></thead><tbody>{(userActivity.sessions || []).map((session) => <tr key={session.id}><td>{formatAdminDateTime(session.started_at)}</td><td>{session.activity_type}</td><td>{session.resource_name || session.resource_key || "—"}</td><td><strong>{formatDuration(session.duration_seconds)}</strong></td><td>{formatAdminDateTime(session.last_heartbeat_at)}</td></tr>)}</tbody></table></div>
                  <h3 style={{ margin: "22px 0 10px" }}>Event Timeline</h3>
                  <div className="admin-table-wrapper"><table className="admin-table"><thead><tr><th>Exact date/time</th><th>Event</th><th>Details</th><th>IP</th></tr></thead><tbody>{(userActivity.events || []).map((event) => <tr key={event.id}><td>{formatAdminDateTime(event.created_at)}</td><td><span className="activity-event-badge">{String(event.event_type || '').replaceAll('_',' ')}</span></td><td>{event.metadata ? JSON.stringify(event.metadata) : '—'}</td><td>{event.ip_address || '—'}</td></tr>)}</tbody></table></div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ================================================
            CUSTOMER SUPPORT
        ================================================= */}
        {activeTab === "support" && (
          <section className="admin-section support-admin-section">
            <div className="admin-section-header">
              <div>
                <span className="admin-eyebrow">LIVE INBOX</span>
                <h2>Customer Support</h2>
                <p>Customers and guests can message you here. Administrators cannot start customer conversations.</p>
              </div>
              <button type="button" className="admin-refresh-btn" onClick={loadSupportConversations}>↻ Refresh</button>
            </div>
            {supportError && <div className="admin-error"><strong>Support error</strong><span>{supportError}</span></div>}
            <div className="support-admin-layout">
              <div className="support-conversation-list">
                {supportConversations.length === 0 ? <div className="admin-empty"><div>💬</div><h3>No conversations yet</h3><p>New customer messages will appear automatically.</p></div> : supportConversations.map((conversation) => (
                  <button key={conversation.id} type="button" className={`support-conversation-item ${supportConversation?.id === conversation.id ? "active" : ""}`} onClick={() => openSupportConversation(conversation)}>
                    <div className="support-conversation-top"><strong>{conversation.customer_name || "Guest customer"}</strong>{Number(conversation.unread_count || 0) > 0 && <span>{conversation.unread_count}</span>}</div>
                    <small>{conversation.customer_email || "Guest session"}{conversation.user_id ? ` · User #${conversation.user_id}` : ""}</small>
                    <p>{conversation.last_message || "No message"}</p>
                  </button>
                ))}
              </div>
              <div className="support-admin-chat">
                {!supportConversation ? <div className="support-admin-empty"><div>💬</div><h3>Select a conversation</h3><p>Choose a customer from the left.</p></div> : (
                  <>
                    <div className="support-admin-chat-header"><div><strong>{supportConversation.customer_name || "Guest customer"}</strong><span>{supportConversation.customer_email || "Guest"}{supportConversation.user_id ? ` · User #${supportConversation.user_id}` : ""}</span></div></div>
                    <div className="support-admin-messages">
                      {supportLoading && supportMessages.length === 0 ? <div className="support-admin-empty">Loading conversation...</div> : supportMessages.map((item) => (
                        <div key={item.id} className={`support-admin-message ${item.sender_type}`}><span>{item.sender_type === "admin" ? "You · Admin" : (supportConversation?.customer_name || "Customer")}</span><p>{item.message}</p><small>{new Date(item.created_at).toLocaleString()}</small></div>
                      ))}
                    </div>
                    <div className="support-admin-compose"><input value={supportDraft} onChange={(e) => setSupportDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); replyToSupport(); } }} placeholder="Reply to customer..." maxLength={2000} /><button type="button" onClick={replyToSupport} disabled={supportLoading || !supportDraft.trim()}>Reply</button></div>
                  </>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ================================================
            ADMIN TEAM / INVITATION CODES
        ================================================= */}
        {activeTab === "team" && (
          <section className="admin-section">
            <div className="admin-section-header">
              <div><span className="admin-eyebrow">SECURITY</span><h2>Administrator Access</h2><p>Only an existing administrator can generate the one-time 6-digit registration code.</p></div>
            </div>
            <div className="admin-invite-card">
              <div><span className="admin-eyebrow">NEW ADMIN INVITATION</span><h3>Generate a 6-digit code</h3><p>The code is stored securely and expires automatically. Give it only to the person you want to add.</p></div>
              <button type="button" className="admin-primary-btn" onClick={generateAdminInvite} disabled={inviteLoading}>{inviteLoading ? "Generating..." : "Generate Code"}</button>
              {inviteCode && <div className="admin-invite-code"><span>ACTIVE INVITE CODE</span><strong>{inviteCode}</strong><small>Expires in {inviteExpires}. It can be used once.</small><button type="button" onClick={() => navigator.clipboard?.writeText(inviteCode)}>Copy code</button></div>}
            </div>
            <div className="admin-security-note">Never put the invitation code in frontend source code or .env files. It is generated by the authenticated admin session.</div>
          </section>
        )}

        {/* ================================================
            ACTIVITY
        ================================================= */}

        {activeTab === "activity" && (
          <section className="admin-section admin-user-activity-page">
            <div className="admin-section-header">
              <div>
                <span className="admin-eyebrow">USER LOG ACTIVITY</span>
                <h2>Live User Activity</h2>
                <p>Every tracked customer action appears here with the exact date and time.</p>
              </div>
              <button
                type="button"
                className="admin-refresh-btn"
                disabled={activityLoading}
                onClick={async () => {
                  try {
                    setActivityLoading(true);
                    setActivityError("");
                    const data = await adminFetch("/api/admin/activity?limit=200");
                    setRecentUserActivity(Array.isArray(data?.activities) ? data.activities : []);
                  } catch (err) {
                    setActivityError(err.message || "Unable to load recent activity.");
                  } finally {
                    setActivityLoading(false);
                  }
                }}
              >
                ↻ {activityLoading ? "Refreshing..." : "Refresh activity"}
              </button>
            </div>

            {activityError && (
              <div className="admin-error">
                <strong>Activity error</strong>
                <span>{activityError}</span>
              </div>
            )}

            <div className="activity-summary-strip">
              <div><strong>{recentUserActivity.length}</strong><span>Recent events</span></div>
              <div><strong>{new Set(recentUserActivity.map((item) => item.user_id)).size}</strong><span>Active users</span></div>
              <div><strong>{recentUserActivity.filter((item) => item.event_type === "login").length}</strong><span>Logins</span></div>
              <div><strong>{recentUserActivity.filter((item) => String(item.event_type || "").startsWith("comment_")).length}</strong><span>Comments</span></div>
              <div><strong>{recentUserActivity.filter((item) => String(item.event_type || "").startsWith("rating_")).length}</strong><span>Ratings</span></div>
            </div>

            <div className="admin-section activity-log-card">
              <div className="activity-log-toolbar">
                <div>
                  <strong>Activity timeline</strong>
                  <span>Newest activity first</span>
                </div>
                <span className="activity-live-pill"><i></i> Live</span>
              </div>
              <div className="admin-table-wrapper">
                {recentUserActivity.length === 0 ? (
                  <div className="admin-empty"><div>⚡</div><h3>No activity yet</h3><p>User log events will appear here automatically.</p></div>
                ) : (
                  <table className="admin-table activity-log-table">
                    <thead>
                      <tr><th>User</th><th>Event</th><th>Book</th><th>Details</th><th>Exact date/time</th></tr>
                    </thead>
                    <tbody>
                      {recentUserActivity.map((item) => {
                        const event = String(item.event_type || "activity").replaceAll("_", " ");
                        const metadata = item.metadata && typeof item.metadata === "object" ? Object.entries(item.metadata).map(([key, value]) => `${key}: ${String(value)}`).join(" · ") : "";
                        return (
                          <tr key={item.id}>
                            <td>
                              <button type="button" className="activity-user-cell" onClick={() => openUserActivity({ id: item.user_id, name: item.user_name, email: item.user_email })}>
                                <span className="admin-mini-avatar">{(item.user_name || item.user_email || "U").charAt(0).toUpperCase()}</span>
                                <span><strong>{item.user_name || "Unknown user"}</strong><small>{item.user_email || "Guest"}</small></span>
                              </button>
                            </td>
                            <td><span className={`activity-event-badge activity-event-${String(item.event_type || "other").replace(/[^a-z0-9-]/gi, "-")}`}>{event}</span></td>
                            <td>{item.book_title || "—"}</td>
                            <td className="activity-details-cell">{metadata || "—"}</td>
                            <td><strong>{formatAdminDateTime(item.created_at)}</strong><small className="activity-ip">{item.ip_address || "IP unavailable"}</small></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </section>
        )}

        {activeTab === "user-log" && (
          <section className="admin-section">
            <div className="admin-section-header"><div><span className="admin-eyebrow">USER ANALYTICS</span><h2>Detailed User Log & Usage</h2><p>Real foreground time for Dashboard, Favorites, Comments and Books.</p></div><button type="button" className="admin-refresh-btn" onClick={loadUsageAnalytics} disabled={usageLoading}>↻ {usageLoading ? "Refreshing..." : "Refresh data"}</button></div>
            {usageError && <div className="admin-error"><strong>Usage analytics error</strong><span>{usageError}</span></div>}
            <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:16}}><select value={usageUserFilter} onChange={e=>setUsageUserFilter(e.target.value)} style={{padding:"10px 12px",border:"1px solid #dbe2ea",borderRadius:10,background:"#fff"}}><option value="">All users</option>{usageAnalytics.users.map(u=><option key={u.id} value={u.id}>{u.name || u.email} · #{u.id}</option>)}</select><select value={usageActivityFilter} onChange={e=>setUsageActivityFilter(e.target.value)} style={{padding:"10px 12px",border:"1px solid #dbe2ea",borderRadius:10,background:"#fff"}}><option value="all">All activity</option><option value="page">Dashboard</option><option value="favorites">Favorites</option><option value="comments">Comments</option><option value="book">Books</option></select></div>
            <div className="admin-table-wrapper"><table className="admin-table"><thead><tr><th>User</th><th>Last Login</th><th>Last Seen</th><th>Total Time</th><th>Dashboard</th><th>Favorites</th><th>Comments</th><th>Books</th><th>Sessions</th></tr></thead><tbody>{usageRows.length===0?<tr><td colSpan="9" style={{textAlign:"center",padding:30}}>No tracked usage yet.</td></tr>:usageRows.map(row=>{const sessions=usageAnalytics.sessions.filter(s=>Number(s.user_id)===Number(row.id)&&(usageActivityFilter==="all"||s.activity_type===usageActivityFilter));const total=sessions.reduce((n,s)=>n+Number(s.duration_seconds||0),0);return <tr key={row.id}><td><button type="button" className="activity-user-cell" onClick={()=>openUserActivity(row)}><span className="admin-mini-avatar">{(row.name||row.email||"U").charAt(0).toUpperCase()}</span><span><strong>{row.name||"Unknown user"}</strong><small>{row.email||"—"}</small></span></button></td><td><strong>{formatAdminDateTime(row.last_login)}</strong><small style={{display:"block",color:"#64748b"}}>{row.login_count||0} login(s)</small></td><td>{formatAdminDateTime(row.last_seen)}</td><td><strong>{formatDuration(total)}</strong></td><td>{formatDuration(row.dashboard_seconds)}</td><td>{formatDuration(row.favorites_seconds)}</td><td>{formatDuration(row.comments_seconds)}</td><td>{formatDuration(row.book_seconds)}</td><td>{sessions.length}</td></tr>})}</tbody></table></div>
            <div style={{marginTop:20,background:"#fff",border:"1px solid #e5e7eb",borderRadius:16,padding:18}}><h3 style={{marginTop:0}}>Book & Page Time Ranking</h3><div className="admin-table-wrapper"><table className="admin-table"><thead><tr><th>Type</th><th>Resource</th><th>Visits</th><th>Total Time</th><th>Average</th></tr></thead><tbody>{[...usageAnalytics.books.map(x=>({...x,type:"Book",name:x.book})),...usageAnalytics.pages.map(x=>({...x,type:"Page",name:x.page}))].slice(0,100).map((x,i)=><tr key={`${x.type}-${x.name}-${i}`}><td>{x.type}</td><td><strong>{x.name}</strong></td><td>{x.visits}</td><td>{formatDuration(x.total_seconds)}</td><td>{formatDuration(x.avg_seconds)}</td></tr>)}</tbody></table></div></div>
          </section>
        )}

        {/* ================================================
            DETAIL DRILL-DOWN MODAL
            (Comments / Favorites / Ratings)
        ================================================= */}

        {detailType && (
          <div
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                closeDetail();
              }
            }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 1000,
              background: "rgba(15, 23, 42, 0.55)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 20,
            }}
          >
            <div
              style={{
                width: "min(760px, 100%)",
                background: "#fff",
                borderRadius: 12,
                padding: 24,
                maxHeight: "85vh",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  marginBottom: 16,
                }}
              >
                <div>
                  <h2 style={{ margin: 0 }}>
                    {detailType === "comments" && "All Comments"}
                    {detailType === "favorites" && "All Favorites"}
                    {detailType === "ratings" && "All Ratings"}
                  </h2>

                  <p
                    style={{
                      margin: "4px 0 0",
                      color: "#6b7280",
                      fontSize: 14,
                    }}
                  >
                    {detailLoading
                      ? "Loading..."
                      : `${detailItems.length} record${
                          detailItems.length === 1 ? "" : "s"
                        }`}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeDetail}
                  style={{
                    border: "none",
                    background: "transparent",
                    fontSize: 22,
                    lineHeight: 1,
                    cursor: "pointer",
                    color: "#6b7280",
                  }}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              {detailError && (
                <div
                  style={{
                    background: "#fef2f2",
                    color: "#b91c1c",
                    padding: "10px 12px",
                    borderRadius: 8,
                    marginBottom: 14,
                    fontSize: 14,
                  }}
                >
                  {detailError}
                </div>
              )}

              <div style={{ overflowY: "auto" }}>
                {detailLoading ? (
                  <div className="admin-empty">
                    <p>Loading {detailType}...</p>
                  </div>
                ) : detailItems.length === 0 ? (
                  <div className="admin-empty">
                    <div>
                      {detailType === "comments" && "💬"}
                      {detailType === "favorites" && "♥"}
                      {detailType === "ratings" && "⭐"}
                    </div>
                    <h3>No {detailType} yet</h3>
                  </div>
                ) : (
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Book</th>
                        <th>User</th>
                        {detailType === "comments" && <th>Comment</th>}
                        {detailType === "ratings" && <th>Rating</th>}
                        <th>Date</th>
                      </tr>
                    </thead>

                    <tbody>
                      {detailItems.map((item, index) => (
                        <tr key={item.id || index}>
                          <td>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                              }}
                            >
                              <img
                                src={
                                  item.book_cover_url ||
                                  "https://via.placeholder.com/40x56?text=Book"
                                }
                                alt={item.book_title || "Book"}
                                onError={(event) => {
                                  event.currentTarget.src =
                                    "https://via.placeholder.com/40x56?text=Book";
                                }}
                                style={{
                                  width: 32,
                                  height: 46,
                                  objectFit: "cover",
                                  borderRadius: 4,
                                  flexShrink: 0,
                                }}
                              />

                              <div>
                                <div style={{ fontWeight: 600 }}>
                                  {item.book_title || "Untitled Book"}
                                </div>

                                {item.book_author && (
                                  <div
                                    style={{ fontSize: 12, color: "#6b7280" }}
                                  >
                                    {item.book_author}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          <td>
                            <div style={{ fontWeight: 600 }}>
                              {item.user_name || "User"}
                            </div>

                            {item.user_email && (
                              <div style={{ fontSize: 12, color: "#6b7280" }}>
                                {item.user_email}
                              </div>
                            )}
                          </td>

                          {detailType === "comments" && (
                            <td style={{ maxWidth: 280 }}>{item.comment}</td>
                          )}

                          {detailType === "ratings" && (
                            <td>
                              {"⭐".repeat(Number(item.rating) || 0)}
                              <span style={{ color: "#6b7280", marginLeft: 4 }}>
                                ({item.rating}/5)
                              </span>
                            </td>
                          )}

                          <td>{formatAdminDate(item.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

/* ======================================================
   MAIN APP
====================================================== */

function App() {
  const [books, setBooks] = useState([]);

  const [favorites, setFavorites] = useState(new Set());

  const [favoriteBooks, setFavoriteBooks] = useState([]);

  const [favoritesOpen, setFavoritesOpen] = useState(false);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [selectedBook, setSelectedBook] = useState(() => {
    try {
      return JSON.parse(
        sessionStorage.getItem("bookwise_selected_book") || "null",
      );
    } catch {
      return null;
    }
  });

  const [bookPage, setBookPage] = useState(() => {
    return (
      window.location.hash.startsWith("#book/") &&
      !!sessionStorage.getItem("bookwise_selected_book")
    );
  });

  /*
   * ADMIN PAGE STATE
   * True when the URL hash is exactly "#admin".
   * Read once on first render, same pattern as bookPage above.
   */
  const [adminPage, setAdminPage] = useState(
    () => window.location.hash === "#admin",
  );
  const [adminAuthPage, setAdminAuthPage] = useState(
    () => window.location.hash === "#admin-login",
  );

  /* ====================================================
     NAVIGATE TO BOOK
     
     This is now the SINGLE function used everywhere.
  ==================================================== */

  const navigateToBook = (book) => {
    if (!book) return;

    /*
     * Set selected book first.
     */
    setSelectedBook(book);

    try {
      sessionStorage.setItem("bookwise_selected_book", JSON.stringify(book));
    } catch {}

    const identifier = getBookIdentifier(book) || book.title || "book";

    const encodedIdentifier = encodeURIComponent(identifier);

    /*
     * Remove an old /book/52 pathname if one exists.
     *
     * Your screenshot showed:
     *
     * /book/52#book/53
     *
     * We don't want that.
     *
     * We want:
     *
     * /#book/53
     */
    window.history.replaceState(null, "", "/");

    /*
     * Now create the clean hash.
     */
    window.location.hash = `book/${encodedIdentifier}`;

    setBookPage(true);
    setAdminPage(false);

    /*
     * Reset normal page scrolling immediately.
     */
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });

    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };

  /* ====================================================
     CLOSE BOOK PAGE
  ==================================================== */

  const closeBookPage = () => {
    try {
      sessionStorage.removeItem("bookwise_selected_book");
    } catch {}

    /*
     * Return to root.
     */
    window.history.replaceState(null, "", "/");

    setSelectedBook(null);
    setBookPage(false);

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });

    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };

  /* ====================================================
     GO TO ADMIN DASHBOARD
  ==================================================== */

  const goToAdmin = () => {
    if (!user || user.role !== "admin") {
      window.history.replaceState(null, "", "/");
      window.location.hash = "admin-login";
      setAdminAuthPage(true);
      setAdminPage(false);
      setBookPage(false);
      setSelectedBook(null);
      return;
    }
    window.history.replaceState(null, "", "/");
    window.location.hash = "admin";

    setBookPage(false);
    setSelectedBook(null);
    setAdminAuthPage(false);
    setAdminPage(true);

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  };

  /* ====================================================
     LEAVE ADMIN DASHBOARD
  ==================================================== */

  const leaveAdmin = () => {
    window.history.replaceState(null, "", "/");
    window.location.hash = "";

    setAdminPage(false);
    setAdminAuthPage(false);

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  };

  /* ====================================================
     HASH CHANGE
  ==================================================== */

  useEffect(() => {
    const onHashChange = () => {
      const isBook = window.location.hash.startsWith("#book/");
      const isAdmin = window.location.hash === "#admin";
      const isAdminAuth = window.location.hash === "#admin-login";

      setBookPage(isBook);
      setAdminPage(isAdmin);
      setAdminAuthPage(isAdminAuth);

      if (!isBook) {
        setSelectedBook(null);
      }
    };

    window.addEventListener("hashchange", onHashChange);

    return () => {
      window.removeEventListener("hashchange", onHashChange);
    };
  }, []);

  const [authModal, setAuthModal] = useState(() => new URLSearchParams(window.location.search).get("reset_token") ? "reset" : null);

  const [user, setUser] = useState(getStoredUser);

  const [token, setToken] = useState(getToken);

  const [recommendations, setRecommendations] = useState([]);

  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  const [popularBooks, setPopularBooks] = useState([]);

  const [loadingPopular, setLoadingPopular] = useState(true);

  const [cartItems, setCartItems] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [checkoutOrderId, setCheckoutOrderId] = useState(null);
  const [paymentNotice, setPaymentNotice] = useState(null);

  useUsageTracker({ token, enabled: Boolean(token && !adminPage && !adminAuthPage && !bookPage && !favoritesOpen), activityType: "page", resourceKey: "dashboard", resourceName: "Dashboard" });
  useUsageTracker({ token, enabled: Boolean(token && !adminPage && !adminAuthPage && !bookPage && favoritesOpen), activityType: "favorites", resourceKey: "favorites", resourceName: "Favorites" });

  /* ====================================================
     LOAD BOOKS
  ==================================================== */

  const loadBooks = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/api/books`);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch books");
      }

      const bookList = Array.isArray(data.books)
        ? data.books
        : Array.isArray(data)
          ? data
          : [];

      setBooks(bookList);
    } catch (error) {
      console.error("Books loading error:", error);

      setError(error.message || "Could not load books.");
    } finally {
      setLoading(false);
    }
  };

  /* ====================================================
     LOAD RECOMMENDATIONS
  ==================================================== */

  const loadRecommendations = async () => {
    const currentToken = getToken();

    if (!currentToken) {
      setRecommendations([]);
      return;
    }

    try {
      setLoadingRecommendations(true);

      const response = await fetch(`${API_URL}/api/recommendations`, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setRecommendations([]);
        }

        return;
      }

      setRecommendations(
        Array.isArray(data.recommendations) ? data.recommendations : [],
      );
    } catch (error) {
      console.error("Recommendations loading error:", error);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  /* ====================================================
     LOAD POPULAR BOOKS
  ==================================================== */

  const loadPopularBooks = async () => {
    try {
      setLoadingPopular(true);

      const response = await fetch(`${API_URL}/api/discover/popular`);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch popular books");
      }

      setPopularBooks(Array.isArray(data.books) ? data.books : []);
    } catch (error) {
      console.error("Popular books loading error:", error);
    } finally {
      setLoadingPopular(false);
    }
  };

  /* ====================================================
     CART + CHECKOUT
  ==================================================== */

  const loadCart = async () => {
    const currentToken = getToken();

    if (!currentToken) {
      setCartItems([]);
      setCartTotal(0);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/cart`, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          handleLogout();
          return;
        }
        throw new Error(data.error || "Failed to load cart");
      }

      setCartItems(Array.isArray(data.items) ? data.items : []);
      setCartTotal(Number(data.total || 0));
    } catch (error) {
      console.error("Cart loading error:", error);
    }
  };

  const handleAddToCart = async (book) => {
    const currentToken = getToken();

    if (!currentToken) {
      setAuthModal("login");
      return;
    }

    const bookId = getBookIdentifier(book);

    if (!bookId || !book.is_for_sale) {
      alert("This book is not currently available for purchase.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/cart/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify({ book_id: bookId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add book to cart");
      }

      await loadCart();
      setCartOpen(true);
    } catch (error) {
      console.error("Add to cart error:", error);
      alert(error.message);
    }
  };

  const updateCartQuantity = async (bookId, quantity) => {
    const currentToken = getToken();
    if (!currentToken) return;

    try {
      const response = await fetch(`${API_URL}/api/cart/items/${bookId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify({ quantity }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update cart");
      }

      await loadCart();
    } catch (error) {
      console.error("Cart update error:", error);
      alert(error.message);
    }
  };

  const removeFromCart = async (bookId) => {
    const currentToken = getToken();
    if (!currentToken) return;

    try {
      const response = await fetch(`${API_URL}/api/cart/items/${bookId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to remove item");
      }

      await loadCart();
    } catch (error) {
      console.error("Remove cart item error:", error);
      alert(error.message);
    }
  };

  const loadOrderStatus = async (orderId) => {
    const currentToken = getToken();
    if (!currentToken || !orderId) return null;

    const response = await fetch(`${API_URL}/api/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${currentToken}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not verify order status");
    return data.order;
  };

  const startPayment = async (provider, reference = "") => {
    const currentToken = getToken();

    if (!currentToken) {
      setAuthModal("login");
      return;
    }

    if (!["esewa", "bank", "btc", "usdt"].includes(provider)) {
      setCheckoutError("Unsupported payment provider.");
      return;
    }

    try {
      setCheckoutLoading(true);
      setCheckoutError("");
      setPaymentNotice(null);

      let orderId = checkoutOrderId;

      if (!orderId) {
        const orderResponse = await fetch(`${API_URL}/api/orders`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${currentToken}`,
            "Content-Type": "application/json",
          },
        });

        const orderData = await orderResponse.json();
        if (!orderResponse.ok) {
          throw new Error(orderData.error || "Could not create order");
        }

        orderId = orderData.order.id;
        setCheckoutOrderId(orderId);
      }

      if (["bank", "btc", "usdt"].includes(provider)) {
        const paymentResponse = await fetch(`${API_URL}/api/payments/manual/submit`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${currentToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ order_id: orderId, provider, reference: reference }),
        });
        const paymentData = await paymentResponse.json();
        if (!paymentResponse.ok) throw new Error(paymentData.error || "Could not submit payment");
        setCheckoutLoading(false);
        setCheckoutOpen(false);
        await loadCart();
        setPaymentNotice({ type: "pending", provider, orderId, message: `Payment recorded for Order #${paymentData.order.order_number}. It is pending manual verification.` });
        return;
      }

      const paymentResponse = await fetch(`${API_URL}/api/payments/${provider}/initiate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${currentToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ order_id: orderId }),
      });

      const paymentData = await paymentResponse.json();
      if (!paymentResponse.ok) {
        throw new Error(paymentData.error || "Could not start payment");
      }

      // The provider receives the customer directly. Secrets and verification
      // stay entirely on the server.
      const form = document.createElement("form");
      form.method = "POST";
      form.action = paymentData.form_url;
      form.style.display = "none";

      Object.entries(paymentData.fields || {}).forEach(([name, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = value;
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
    } catch (error) {
      console.error("Payment initiation error:", error);
      setCheckoutError(error.message || "Payment could not be started.");
      setCheckoutLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");
    const provider = params.get("provider");
    const orderId = Number(params.get("order"));

    if (!payment || !provider || !Number.isInteger(orderId) || orderId <= 0) return;

    let cancelled = false;

    const verifyReturn = async () => {
      try {
        const order = await loadOrderStatus(orderId);
        if (cancelled || !order) return;

        setCheckoutOrderId(order.id);
        setCheckoutOpen(false);
        setCartOpen(false);
        await loadCart();

        if (order.status === "paid" || payment === "success") {
          setPaymentNotice({ type: "success", provider, orderId: order.id, message: `Payment confirmed successfully. Order #${order.order_number} is paid.` });
        } else if (payment === "pending" || order.status === "pending") {
          setPaymentNotice({ type: "pending", provider, orderId: order.id, message: `Payment is still pending. We have not marked Order #${order.order_number} as paid.` });
        } else {
          setPaymentNotice({ type: "error", provider, orderId: order.id, message: `Payment was not completed. Order #${order.order_number} remains unpaid.` });
        }
      } catch (error) {
        console.error("Payment return verification error:", error);
        if (!cancelled) {
          setPaymentNotice({ type: "pending", provider, orderId, message: "We received the payment return, but could not confirm the final status yet. Please check again before retrying." });
        }
      } finally {
        if (!cancelled) {
          window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
        }
      }
    };

    verifyReturn();
    return () => { cancelled = true; };
  }, []);

  /* ====================================================
     LOGOUT
  ==================================================== */

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setToken(null);
    setUser(null);

    setFavorites(new Set());
    setFavoriteBooks([]);
    setRecommendations([]);
    setCartItems([]);
    setCartTotal(0);
    setCartOpen(false);
    setCheckoutOpen(false);
    setCheckoutOrderId(null);
    setPaymentNotice(null);
    setFavoritesOpen(false);
    setAuthModal(null);
  };

  /* ====================================================
     LOAD FAVORITES
  ==================================================== */

  const loadFavorites = async () => {
    const currentToken = getToken();

    if (!currentToken) {
      setFavorites(new Set());
      setFavoriteBooks([]);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/favorites`, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          handleLogout();
        }

        return;
      }

      const favoriteList = Array.isArray(data) ? data : data.favorites || [];

      const favoriteIds = new Set();

      const formattedFavorites = favoriteList
        .map((favorite) => {
          const book = favorite.book || favorite;

          const bookId = Number(favorite.book_id || book.id);

          if (!bookId) {
            return null;
          }

          favoriteIds.add(String(bookId));

          if (book.google_book_id) {
            favoriteIds.add(String(book.google_book_id));
          }

          const createdDate =
            favorite.created_at || favorite.favorite_date || favorite.createdAt;

          return {
            ...book,
            id: bookId,
            favorite_date: formatDate(createdDate),
          };
        })
        .filter(Boolean);

      setFavorites(favoriteIds);
      setFavoriteBooks(formattedFavorites);
    } catch (error) {
      console.error("Favorites loading error:", error);
    }
  };

  /* ====================================================
     INITIAL LOAD
  ==================================================== */

  useEffect(() => {
    loadBooks();
    loadFavorites();
    loadPopularBooks();
    loadRecommendations();
    loadCart();
  }, []);

  /* ====================================================
     FAVORITE
  ==================================================== */

  const handleFavorite = async (book) => {
    const currentToken = getToken();

    if (!currentToken) {
      setAuthModal("login");
      return;
    }

    const identifier = getBookIdentifier(book);

    if (!identifier) {
      alert("This book isn't in our library yet, so it can't be favorited.");

      return;
    }

    const isCurrentlyFavorite = favorites.has(identifier);

    try {
      if (isCurrentlyFavorite) {
        const response = await fetch(`${API_URL}/api/favorites/${identifier}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to remove favorite");
        }

        setFavorites((previous) => {
          const next = new Set(previous);

          next.delete(identifier);

          if (data.favorite?.book_id) {
            next.delete(String(data.favorite.book_id));
          }

          return next;
        });

        setFavoriteBooks((previous) =>
          previous.filter((item) => getBookIdentifier(item) !== identifier),
        );
      } else {
        const response = await fetch(`${API_URL}/api/favorites`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${currentToken}`,
          },
          body: JSON.stringify({
            book_id: identifier,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to add favorite");
        }

        const resolvedId = data.book?.id || data.favorite?.book_id || null;

        setFavorites((previous) => {
          const next = new Set(previous);

          next.add(identifier);

          if (resolvedId) {
            next.add(String(resolvedId));
          }

          return next;
        });

        const createdDate =
          data.created_at ||
          data.favorite?.created_at ||
          new Date().toISOString();

        const favoriteBook = {
          ...book,
          id: resolvedId || book.id,
          google_book_id: data.book?.google_book_id || book.google_book_id,
          favorite_date: formatDate(createdDate),
        };

        setFavoriteBooks((previous) => {
          const exists = previous.some(
            (item) => getBookIdentifier(item) === identifier,
          );

          if (exists) {
            return previous;
          }

          return [favoriteBook, ...previous];
        });
      }
    } catch (error) {
      console.error("Favorite error:", error);

      alert(error.message);
    }
  };

  /* ====================================================
     AUTH SUCCESS
  ==================================================== */

  const handleAuthSuccess = (data) => {
    if (data.token) {
      localStorage.setItem("token", data.token);

      setToken(data.token);
    }

    if (data.user) {
      localStorage.setItem("user", JSON.stringify(data.user));

      setUser(data.user);
    }

    setAuthModal(null);

    loadFavorites();
    loadRecommendations();
    loadCart();
  };

  /* ====================================================
     SEARCH
  ==================================================== */

  useEffect(() => {
    const query = search.trim();

    if (!query) {
      loadBooks();
      return;
    }

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/api/discover/search?q=${encodeURIComponent(query)}`,
          {
            signal: controller.signal,
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to search books");
        }

        setBooks(
          Array.isArray(data.books)
            ? data.books
            : Array.isArray(data)
              ? data
              : [],
        );
      } catch (error) {
        if (error.name === "AbortError") {
          return;
        }

        console.error("Search error:", error);

        setError(error.message || "Search failed.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [search]);

  const filteredBooks = useMemo(() => books, [books]);

  /* ====================================================
     SCROLL TO CATALOG
  ==================================================== */

  const scrollToBooks = () => {
    document.getElementById("book-catalog")?.scrollIntoView({
      behavior: "smooth",
    });
  };

  /* ====================================================
     SELECTED BOOK
  ==================================================== */

  const selectedBookIdentifier = getBookIdentifier(selectedBook);

  /* ====================================================
     ADMIN DASHBOARD PAGE / FULL BOOK PAGE / MAIN PAGE

     IMPORTANT:
     AuthModal is rendered ONCE, OUTSIDE all three page
     branches below (as a sibling in the fragment), so it
     mounts and appears IMMEDIATELY on top of whichever page
     is currently active — book page, admin page, or home —
     instead of only showing up after navigating back home.
  ==================================================== */

  return (
    <>
      {adminAuthPage ? (
        <AdminPortal
          onBackToBookWise={leaveAdmin}
          onAdminSuccess={(data) => {
            if (data.token) { localStorage.setItem("token", data.token); setToken(data.token); }
            if (data.user) { localStorage.setItem("user", JSON.stringify(data.user)); setUser(data.user); }
            window.location.hash = "admin";
            setAdminAuthPage(false);
            setAdminPage(true);
          }}
        />
      ) : adminPage ? (
        <AdminDashboard
          user={user}
          token={token}
          onLogout={() => {
            handleLogout();
            leaveAdmin();
          }}
          onBackToBookWise={leaveAdmin}
        />
      ) : bookPage && selectedBook ? (
        <BookDetailModal
          book={selectedBook}
          onClose={closeBookPage}
          isFavorite={
            selectedBookIdentifier
              ? favorites.has(selectedBookIdentifier)
              : false
          }
          onFavorite={handleFavorite}
          token={token}
          onLoginRequired={() => setAuthModal("login")}
          favorites={favorites}
          onOpenBook={navigateToBook}
          onAddToCart={handleAddToCart}
          fullPage
        />
      ) : (
        <div className="app">
          {/* NAVBAR */}

          <nav className="navbar">
            <div className="nav-container">
              <button
                type="button"
                className="brand"
                onClick={() => {
                  setSearch("");

                  window.scrollTo({
                    top: 0,
                    behavior: "smooth",
                  });
                }}
              >
                <span className="brand-icon">📚</span>

                <span>BookWise</span>
              </button>

              {/* SEARCH */}

              <div className="nav-search">
                <span className="search-icon">🔎</span>

                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search books, authors..."
                />

                {search && (
                  <button
                    type="button"
                    className="clear-search"
                    onClick={() => setSearch("")}
                  >
                    ×
                  </button>
                )}
              </div>

              {/* NAV ACTIONS */}

              <div className="nav-actions">
                {user && (
                  <div className="favorites-wrapper">
                    <button
                      type="button"
                      className={`favorites-nav-btn ${
                        favoritesOpen ? "active" : ""
                      }`}
                      onClick={() => setFavoritesOpen((previous) => !previous)}
                    >
                      <span className="heart-icon">♥</span>

                      <span className="favorites-label">Favorites</span>

                      {favoriteBooks.length > 0 && (
                        <span className="favorites-count">
                          {favoriteBooks.length}
                        </span>
                      )}
                    </button>

                    {favoritesOpen && (
                      <div className="favorites-dropdown">
                        <div className="favorites-dropdown-header">
                          <div>
                            <h3>My Favorites</h3>

                            <p>
                              {favoriteBooks.length} saved{" "}
                              {favoriteBooks.length === 1 ? "book" : "books"}
                            </p>
                          </div>

                          <span className="favorites-header-icon">♥</span>
                        </div>

                        {favoriteBooks.length === 0 ? (
                          <div className="favorites-empty">
                            <div>♡</div>

                            <h4>No favorite books yet</h4>

                            <p>Click the heart on a book to save it here.</p>
                          </div>
                        ) : (
                          <div className="favorites-list">
                            {favoriteBooks.map((favorite) => (
                              <div
                                className="favorite-dropdown-item"
                                key={
                                  getBookIdentifier(favorite) || favorite.title
                                }
                                onClick={() => {
                                  setFavoritesOpen(false);

                                  /*
                                   * IMPORTANT:
                                   * Use the same navigation
                                   * function here.
                                   */
                                  navigateToBook(favorite);
                                }}
                              >
                                <img
                                  src={
                                    favorite.cover_url ||
                                    "https://via.placeholder.com/70x100?text=Book"
                                  }
                                  alt={favorite.title}
                                  onError={(event) => {
                                    event.currentTarget.src =
                                      "https://via.placeholder.com/70x100?text=Book";
                                  }}
                                />

                                <div className="favorite-dropdown-info">
                                  <h4>{favorite.title}</h4>

                                  <p>{favorite.author || "Unknown Author"}</p>

                                  <span>♥ Added {favorite.favorite_date}</span>
                                </div>

                                <button
                                  type="button"
                                  className="favorite-remove-small"
                                  onClick={(event) => {
                                    event.stopPropagation();

                                    handleFavorite(favorite);
                                  }}
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {user && (
                  <button
                    type="button"
                    className="nav-btn"
                    onClick={() => {
                      loadCart();
                      setCartOpen(true);
                    }}
                  >
                    🛒 Cart {cartItems.length > 0 ? `(${cartItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0)})` : ""}
                  </button>
                )}

                <button type="button" className="nav-btn admin-portal-nav-btn" onClick={goToAdmin}>
                  🛡️ {user && user.role === "admin" ? "Admin Dashboard" : "Admin Portal"}
                </button>

                {user ? (
                  <>
                    <span className="welcome-user">
                      Hi, {user.name || "Reader"}
                    </span>

                    <button
                      type="button"
                      className="nav-btn logout-btn"
                      onClick={handleLogout}
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="nav-btn"
                      onClick={() => setAuthModal("login")}
                    >
                      Login
                    </button>

                    <button
                      type="button"
                      className="nav-btn nav-register"
                      onClick={() => setAuthModal("register")}
                    >
                      Register
                    </button>
                  </>
                )}
              </div>
            </div>
          </nav>

          {/* HERO */}

          {!search && (
            <header className="hero">
              <div className="hero-content">
                <span className="hero-label">YOUR PERSONAL BOOK DISCOVERY</span>

                <h1>
                  Find your next
                  <span>favorite book.</span>
                </h1>

                <p>
                  Explore books, rate your favorites, share your thoughts, and
                  discover something new.
                </p>

                <button
                  type="button"
                  className="hero-btn"
                  onClick={scrollToBooks}
                >
                  Explore Books →
                </button>
              </div>
            </header>
          )}

          {/* MAIN */}

          <main className="main-content" id="book-catalog">
            {search && (
              <div className="search-heading">
                <span>SEARCH RESULTS</span>

                <h1>Results for "{search}"</h1>

                <p>{filteredBooks.length} books found</p>
              </div>
            )}

            {error && (
              <div className="error-box">
                <strong>Something went wrong</strong>

                <span>{error}</span>

                <button type="button" onClick={loadBooks}>
                  Try Again
                </button>
              </div>
            )}

            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>

                <h2>Loading books...</h2>

                <p>Finding great books for you.</p>
              </div>
            ) : filteredBooks.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📚</div>

                <h2>No books found</h2>

                <p>Try another title, author, or search term.</p>

                <button type="button" onClick={() => setSearch("")}>
                  Show All Books
                </button>
              </div>
            ) : (
              <>
                {/* PERSONALIZED RECOMMENDATIONS */}

                {!search && user && (
                  <BookCarousel
                    title="Suggested For You"
                    subtitle="Picked based on your favorites, ratings, and reading history"
                    books={recommendations}
                    favorites={favorites}
                    onFavorite={handleFavorite}
                    /*
                     * IMPORTANT:
                     * Every recommended book uses
                     * navigateToBook().
                     */
                    onOpen={navigateToBook}
                    onAddToCart={handleAddToCart}
                    loading={loadingRecommendations}
                  />
                )}

                {/* POPULAR BOOKS */}

                {!search && (
                  <BookCarousel
                    title="Popular Books"
                    subtitle="Highest rated books in our library"
                    books={popularBooks}
                    favorites={favorites}
                    onFavorite={handleFavorite}
                    onOpen={navigateToBook}
                    onAddToCart={handleAddToCart}
                    loading={loadingPopular}
                  />
                )}

                {/* ALL BOOKS */}

                <BookGrid
                  title={search ? "Search Results" : "All Books"}
                  books={filteredBooks}
                  favorites={favorites}
                  onFavorite={handleFavorite}
                  onOpen={navigateToBook}
                  onAddToCart={handleAddToCart}
                />
              </>
            )}
          </main>

          {/* FOOTER */}

          <footer className="footer">
            <div>
              <strong>📚 BookWise</strong>

              <p>Discover. Read. Review.</p>
            </div>

            <span>© 2026 BookWise. All rights reserved.</span>
          </footer>
        </div>
      )}

      {paymentNotice && (
        <div
          role="status"
          style={{
            position: "fixed",
            top: 18,
            right: 18,
            zIndex: 20000,
            width: "min(430px, calc(100vw - 36px))",
            padding: "16px 18px",
            borderRadius: 14,
            background: paymentNotice.type === "success" ? "#f0fdf4" : paymentNotice.type === "pending" ? "#fffbeb" : "#fef2f2",
            border: `1px solid ${paymentNotice.type === "success" ? "#86efac" : paymentNotice.type === "pending" ? "#fcd34d" : "#fecaca"}`,
            color: paymentNotice.type === "success" ? "#166534" : paymentNotice.type === "pending" ? "#92400e" : "#991b1b",
            boxShadow: "0 18px 45px rgba(15,23,42,.16)",
          }}
        >
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <strong style={{ fontSize: 20 }}>{paymentNotice.type === "success" ? "✓" : paymentNotice.type === "pending" ? "!" : "×"}</strong>
            <div style={{ flex: 1 }}>
              <strong style={{ display: "block", marginBottom: 4 }}>{paymentNotice.type === "success" ? "Payment successful" : paymentNotice.type === "pending" ? "Payment pending" : "Payment not completed"}</strong>
              <span style={{ fontSize: 13, lineHeight: 1.45 }}>{paymentNotice.message}</span>
            </div>
            <button type="button" onClick={() => setPaymentNotice(null)} style={{ border: 0, background: "transparent", cursor: "pointer", fontSize: 20, lineHeight: 1 }}>×</button>
          </div>
        </div>
      )}

      {cartOpen && user && (
        <CartDrawer
          items={cartItems}
          total={cartTotal}
          onClose={() => setCartOpen(false)}
          onUpdateQuantity={updateCartQuantity}
          onRemove={removeFromCart}
          onCheckout={() => {
            if (!cartItems.length) return;
            setCartOpen(false);
            setCheckoutError("");
            setCheckoutOrderId(null);
            setCheckoutOpen(true);
          }}
        />
      )}

      {checkoutOpen && user && (
        <CheckoutModal
          total={cartTotal}
          loading={checkoutLoading}
          error={checkoutError}
          onClose={() => {
            if (!checkoutLoading) setCheckoutOpen(false);
          }}
          onPayment={startPayment}
        />
      )}

      {!adminPage && !adminAuthPage && (!user || user.role !== "admin") && <SupportWidget user={user} />}

      {/* AUTH MODAL — always mounted as a sibling of whichever
          page is active above, so it shows instantly on top of
          the book page, admin page, or home page alike. */}

      {authModal && (
        <AuthModal
          mode={authModal}
          setMode={setAuthModal}
          onClose={() => setAuthModal(null)}
          onSuccess={handleAuthSuccess}
        />
      )}
    </>
  );
}

export default App;
