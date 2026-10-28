const assert = require('node:assert/strict');
const path = require('node:path');
const xcode = require('xcode');
const { configureProject } = require('../plugins/withNotePilotShare');
const project = xcode.project(path.join(__dirname, '../tests/fixtures/expo-sdk58.pbxproj'));
project.parseSync();
configureProject(project, 'com.notepilot.companion', '0.1.0', '1');
const targets = Object.entries(project.pbxNativeTargetSection()).filter(
  ([key]) => !key.endsWith('_comment'),
);
const [id, target] = targets.find(
  ([, value]) => value.name.replaceAll('"', '') === 'NotePilotShare',
);
assert.equal(project.pbxSourcesBuildPhaseObj(id).files.length, 1);
assert(project.pbxSourcesBuildPhaseObj(id).files[0].comment.includes('ShareViewController.swift'));
const app = project.getFirstTarget().firstTarget;
assert(
  app.dependencies.some(
    (ref) => project.hash.project.objects.PBXTargetDependency[ref.value].target === id,
  ),
);
const phases = Object.entries(project.hash.project.objects.PBXCopyFilesBuildPhase).filter(
  ([key]) => !key.endsWith('_comment'),
);
assert(
  phases.some(
    ([, phase]) =>
      Number(phase.dstSubfolderSpec) === 13 &&
      phase.files.some((file) => file.comment.includes('NotePilotShare.appex')),
  ),
);
for (const ref of project.pbxXCConfigurationList()[target.buildConfigurationList]
  .buildConfigurations) {
  const settings = project.pbxXCBuildConfigurationSection()[ref.value].buildSettings;
  assert.equal(settings.APPLICATION_EXTENSION_API_ONLY, 'YES');
  assert.equal(settings.PRODUCT_BUNDLE_IDENTIFIER, '"com.notepilot.companion.share"');
  assert.equal(settings.INFOPLIST_FILE, '"NotePilotShare/Info.plist"');
}
const once = project.writeSync();
configureProject(project, 'com.notepilot.companion', '0.1.0', '1');
assert.equal(project.writeSync(), once);
const parsed = xcode.project('unused');
parsed.hash = require('xcode/lib/parser/pbxproj').parse(once);
assert(
  Object.values(parsed.pbxNativeTargetSection()).some(
    (value) => typeof value === 'object' && value.name.replaceAll('"', '') === 'NotePilotShare',
  ),
);
console.log(
  'PASS: extension target, source, host dependency, embedding, settings, idempotence, and serialized project parsing.',
);
