export function stateTextColor(state) {
  switch (state) {
    case 0:
      return "text-red";
    case 1:
      return "text-green";
    default:
      return "text-black";
  }
}

export function stateIcon(state) {
  switch (state) {
    case 0:
      return "highlight_off";
    case 1:
      return "check_circle";
    default:
      return "help_outline";
  }
}

export function riskText(riskLevel) {
  switch (riskLevel) {
    case 0:
      return "低风险";
    case 1:
      return "中风险";
    case 2:
      return "高风险";
  }
}

export function riskColor(riskLevel) {
  switch (riskLevel) {
    case 0:
      return "green";
    case 1:
      return "orange";
    case 2:
      return "red";
  }
}
