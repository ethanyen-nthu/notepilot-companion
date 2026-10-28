const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const xcode = require('xcode');
const { configureProject } = require('../plugins/withNotePilotShare');
const ios = path.join(__dirname, '..', 'ios');
const name = fs.readdirSync(ios).find((file) => file.endsWith('.xcodeproj'));
assert(name, 'Run npm run prebuild:ios first.');
const project = xcode.project(path.join(ios, name, 'project.pbxproj'));
project.parseSync();
const section = project.pbxNativeTargetSection();
const targets = Object.entries(section).filter(([key]) => !key.endsWith('_comment'));
const share = targets.filter(([, target]) => target.name.replaceAll('"', '') === 'NotePilotShare');
assert.equal(share.length, 1, 'Exactly one share target must exist.');
const [id, target] = share[0];
assert.equal(target.productType.replaceAll('"', ''), 'com.apple.product-type.app-extension');
const sources = project.pbxSourcesBuildPhaseObj(id);
assert.equal(sources.files.length, 1);
assert(sources.files[0].comment.includes('ShareViewController.swift'));
const configs = project.pbxXCConfigurationList()[target.buildConfigurationList].buildConfigurations;
for (const ref of configs) {
  const settings = project.pbxXCBuildConfigurationSection()[ref.value].buildSettings;
  assert.equal(settings.APPLICATION_EXTENSION_API_ONLY, 'YES');
  assert.equal(settings.INFOPLIST_FILE.replaceAll('"', ''), 'NotePilotShare/Info.plist');
}
const app = project.getFirstTarget().firstTarget;
assert(
  app.dependencies.some(
    (ref) => project.hash.project.objects.PBXTargetDependency[ref.value].target === id,
  ),
);
const copyPhases = Object.entries(project.hash.project.objects.PBXCopyFilesBuildPhase).filter(
  ([key]) => !key.endsWith('_comment'),
);
assert(
  copyPhases.some(
    ([, phase]) =>
      Number(phase.dstSubfolderSpec) === 13 &&
      phase.files.some((file) => file.comment.includes('NotePilotShare.appex')),
  ),
  'Extension must be embedded in PlugIns.',
);
assert(fs.existsSync(path.join(ios, 'NotePilotShare', 'ShareViewController.swift')));
const original = project.writeSync();
configureProject(project, 'com.notepilot.companion', '0.1.0', '1');
assert.equal(project.writeSync(), original, 'Plugin must be idempotent.');
console.log(
  'Native project verified: target, Swift source, embed phase, dependency, settings, idempotence. This is not a Swift compile.',
);
