document.addEventListener('DOMContentLoaded', event => {
  const pc_requirements_json = '{{game.pc_requirements}}';

  const pc_requirements = JSON.parse(pc_requirements_json.replace(/&quot;/g, '"')); // HTML에서 JSON으로 변환 시, &quot; 를 " 로 변환해야 합니다.

  let displayText = `<strong>PC 요구사항:</strong><br/>`;

  // 최소 요구사항
  displayText += `<strong>최소:</strong><br/>`;
  displayText += `OS: ${pc_requirements.minimum.OS}<br/>`;
  displayText += `Processor: ${pc_requirements.minimum.Processor}<br/>`;
  displayText += `Memory: ${pc_requirements.minimum.Memory}<br/>`;
  displayText += `Graphics: ${pc_requirements.minimum.Graphics}<br/>`;
  displayText += `DirectX: ${pc_requirements.minimum.DirectX}<br/>`;
  displayText += `Storage: ${pc_requirements.minimum.Storage}<br/>`;
  displayText += `Sound Card: ${pc_requirements.minimum.SoundCard}<br/>`;

  // 추천 요구사항
  displayText += `<strong>추천:</strong><br/>`;
  displayText += `OS: ${pc_requirements.recommended.OS}<br/>`;
  displayText += `Processor: ${pc_requirements.recommended.Processor}<br/>`;
  displayText += `Memory: ${pc_requirements.recommended.Memory}<br/>`;
  displayText += `Graphics: ${pc_requirements.recommended.Graphics}<br/>`;
  displayText += `DirectX: ${pc_requirements.recommended.DirectX}<br/>`;
  displayText += `Storage: ${pc_requirements.recommended.Storage}<br/>`;
  displayText += `Sound Card: ${pc_requirements.recommended.SoundCard}<br/>`;

  document.getElementById('pcRequirements').innerHTML = displayText;
});
