import * as Analytics from "expo-firebase-analytics";

export const logCalculation = async (
  ratio: number,
  severity: string
) => {
  await Analytics.logEvent("calculate_index", {
    ratio: Math.round(ratio),
    severity,
  });
};

export const logLogin = async () => {
  await Analytics.logEvent("user_login");
};

export const logRegister = async () => {
  await Analytics.logEvent("user_register");
};
