import * as THREE from 'three';


/* =========================================================
   PROJECT MODAL
   ========================================================= */

const projectModal = document.getElementById('projectModal');
const projectModalTitle = document.getElementById('projectModalTitle');
const projectModalTag = document.getElementById('projectModalTag');
const projectModalDescription =
  document.getElementById('projectModalDescription');

const projectModalGithub =
  document.getElementById('projectModalGithub');

const projectModalDemo =
  document.getElementById('projectModalDemo');

const projectModalClose =
  projectModal.querySelector('.project-modal-close');

let lastProjectTrigger = null;


function openProjectModal(card, trigger) {

  lastProjectTrigger = trigger;

  projectModalTitle.textContent =
    card.dataset.projectTitle || '';

  projectModalTag.textContent =
    card.dataset.projectTag || '';

  projectModalDescription.textContent =
    card.dataset.projectDescription || '';


  const github = card.dataset.projectGithub;
  const demo = card.dataset.projectDemo;


  if (github && github !== '#') {

    projectModalGithub.href = github;
    projectModalGithub.hidden = false;

  } else {

    projectModalGithub.hidden = true;

  }


  if (demo && demo !== '#') {

    projectModalDemo.href = demo;
    projectModalDemo.hidden = false;

  } else {

    projectModalDemo.hidden = true;

  }


  projectModal.classList.add('is-open');

  projectModal.setAttribute(
    'aria-hidden',
    'false'
  );

  document.body.classList.add('modal-open');

  projectModalClose.focus();
}


function closeProjectModal() {

  if (!projectModal.classList.contains('is-open')) {
    return;
  }

  projectModal.classList.remove('is-open');

  projectModal.setAttribute(
    'aria-hidden',
    'true'
  );

  document.body.classList.remove('modal-open');

  if (lastProjectTrigger) {
    lastProjectTrigger.focus();
  }
}


document
  .querySelectorAll('.project-details-button')
  .forEach((button) => {

    button.addEventListener('click', () => {

      const card = button.closest('.project-card');

      if (!card) {
        return;
      }

      openProjectModal(
        card,
        button
      );

    });

  });


document
  .querySelectorAll('[data-close-project-modal]')
  .forEach((element) => {

    element.addEventListener(
      'click',
      closeProjectModal
    );

  });


document.addEventListener(
  'keydown',
  (event) => {

    if (
      event.key === 'Escape' &&
      projectModal.classList.contains('is-open')
    ) {

      closeProjectModal();

    }

  }
);


/* Stop placeholder # demo links from jumping to page top */

document
  .querySelectorAll('.project-demo-link[href="#"]')
  .forEach((link) => {

    link.addEventListener('click', (event) => {
      event.preventDefault();
    });

  });


/* Prevent unfinished contact form from reloading page */

document
  .getElementById('contactForm')
  .addEventListener(
    'submit',
    (event) => {

      event.preventDefault();

    }
  );


/* =========================================================
   CANDY STAGE
   ========================================================= */

const stageEl =
  document.getElementById('candyStage');

const hero =
  document.getElementById('top');

const candyColor =
  0xfcccec;

const CANDY_COUNT =
  25;


let width =
  hero.clientWidth;

let height =
  hero.clientHeight;


/* =========================================================
   RENDERER
   ========================================================= */

const renderer =
  new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
  });

renderer.setClearColor(
  0x000000,
  0
);

renderer.setPixelRatio(
  Math.min(
    window.devicePixelRatio,
    2
  )
);

renderer.setSize(
  width,
  height
);

renderer.shadowMap.enabled =
  true;

renderer.shadowMap.type =
  THREE.PCFSoftShadowMap;

renderer.outputColorSpace =
  THREE.SRGBColorSpace;

stageEl.appendChild(
  renderer.domElement
);


const scene =
  new THREE.Scene();


/* =========================================================
   CAMERA
   ========================================================= */

const VIEW_HEIGHT =
  5;

const CAMERA_PITCH_DEGREES =
  20;


const camera =
  new THREE.OrthographicCamera(
    -1,
    1,
    1,
    -1,
    0.1,
    50
  );


camera.up.set(
  0,
  0,
  -1
);


camera.position.set(
  0,
  10,
  Math.tan(
    THREE.MathUtils.degToRad(
      CAMERA_PITCH_DEGREES
    )
  ) * 10
);


camera.lookAt(
  0,
  0,
  0
);


function fitCameraFrustum() {

  const aspect =
    width / height;

  camera.left =
    -VIEW_HEIGHT * aspect;

  camera.right =
    VIEW_HEIGHT * aspect;

  camera.top =
    VIEW_HEIGHT;

  camera.bottom =
    -VIEW_HEIGHT;

  camera.updateProjectionMatrix();

}


fitCameraFrustum();


/* =========================================================
   LIGHTS
   ========================================================= */

const ambient =
  new THREE.AmbientLight(
    0xffffff,
    3
  );

scene.add(
  ambient
);


const key =
  new THREE.DirectionalLight(
    0xffffff,
    4
  );


key.position.set(
  3.2,
  6,
  3.5
);


key.castShadow =
  true;

key.shadow.mapSize.set(
  1024,
  1024
);

key.shadow.bias =
  -0.0015;

key.shadow.radius =
  18;

scene.add(
  key
);


scene.add(
  key.target
);

key.target.position.set(
  0,
  0,
  0
);


/* =========================================================
   SHADOW CATCHER
   ========================================================= */

let shadowGradientUniforms;


const groundMaterial =
  new THREE.ShadowMaterial({
    color: 0xffffff,
    opacity: 0.7,
    // Include the floor in the refraction pass, while retaining alpha
    // blending in the main pass so the HTML beneath the canvas stays visible.
    transparent: false,
    blending: THREE.CustomBlending,
    blendSrc: THREE.SrcAlphaFactor,
    blendDst: THREE.OneMinusSrcAlphaFactor,
    blendSrcAlpha: THREE.OneFactor,
    blendDstAlpha: THREE.OneMinusSrcAlphaFactor
  });

const shadowRefractionPass = { value: false };


groundMaterial.onBeforeCompile =
  (shader) => {

    shader.uniforms.shadowRefractionPass = shadowRefractionPass;

    shader.uniforms.shadowCenters =
      shadowGradientUniforms.centers;

    shader.uniforms.shadowColors =
      shadowGradientUniforms.colors;

    shader.uniforms.shadowEdgeColor =
      shadowGradientUniforms.edgeColor;

    shader.uniforms.shadowGradientRadius =
      shadowGradientUniforms.radius;


    shader.vertexShader =
      shader.vertexShader

        .replace(
          '#include <common>',
          `
          #include <common>
          varying vec3 vGroundWorldPosition;
          `
        )

        .replace(
          '#include <worldpos_vertex>',
          `
          #include <worldpos_vertex>
          vGroundWorldPosition = worldPosition.xyz;
          `
        );


    shader.fragmentShader =
      shader.fragmentShader

        .replace(
          '#include <common>',
          `
          #include <common>

          varying vec3 vGroundWorldPosition;

          uniform vec3 shadowCenters[${CANDY_COUNT}];
          uniform vec3 shadowColors[${CANDY_COUNT}];
          uniform bool shadowRefractionPass;
          uniform vec3 shadowEdgeColor;
          uniform float shadowGradientRadius;
          `
        )

        .replace(
          'gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );',
          `
          float closestShadowDistance = 1e6;
          vec3 closestShadowColor = shadowEdgeColor;

          for (
            int i = 0;
            i < ${CANDY_COUNT};
            i++
          ) {

            float distanceToCenter =
              length(
                vGroundWorldPosition.xz -
                shadowCenters[i].xz
              );

            if (
              distanceToCenter <
              closestShadowDistance
            ) {

              closestShadowDistance =
                distanceToCenter;

              closestShadowColor =
                shadowColors[i];

            }

          }

          float gradientProgress =
            smoothstep(
              0.08,
              1.0,
              closestShadowDistance /
              shadowGradientRadius
            );

          vec3 shadowGradientColor =
            mix(
              pow(closestShadowColor, vec3(12.0)),
              pow(closestShadowColor, vec3(4.0)),
              gradientProgress
            );

          float shadowAlpha = opacity * (1.0 - getShadowMask());
          // Refraction samples a white floor with colored shadows. The main
          // canvas shows only the shadows, preserving the HTML underneath.
          gl_FragColor = shadowRefractionPass
            ? vec4(mix(vec3(1.0), shadowGradientColor, shadowAlpha), 1.0)
            : vec4(shadowGradientColor, shadowAlpha);
          `
        );

  };


groundMaterial.customProgramCacheKey =
  () =>
    'candy-shadow-refraction-v3';


const ground =
  new THREE.Mesh(
    new THREE.PlaneGeometry(
      1,
      1
    ),
    groundMaterial
  );


ground.onBeforeRender = (activeRenderer) => {
  shadowRefractionPass.value = activeRenderer.getRenderTarget() !== null;
};

ground.rotation.x =
  -Math.PI / 2;

ground.position.y =
  0;

ground.receiveShadow =
  true;

scene.add(
  ground
);


function fitGroundToViewport() {

  const groundWidth =
    camera.right -
    camera.left;

  const groundHeight =
    camera.top -
    camera.bottom;


  ground.scale.set(
    groundWidth,
    groundHeight,
    1
  );


  const shadowExtent =
    Math.max(
      groundWidth,
      groundHeight
    ) * 0.75;


  key.shadow.camera.left =
    -shadowExtent;

  key.shadow.camera.right =
    shadowExtent;

  key.shadow.camera.top =
    shadowExtent;

  key.shadow.camera.bottom =
    -shadowExtent;

  key.shadow.camera.near =
    0.5;

  key.shadow.camera.far =
    20;

  key.shadow.camera
    .updateProjectionMatrix();

}


fitGroundToViewport();


/* =========================================================
   KONPEITO GEOMETRY
   ========================================================= */

function makeKonpeitoGeometry(
  radius,
  knobCount,
  knobHeight,
  knobFalloff,
  detail
) {

  const geo =
    new THREE.IcosahedronGeometry(
      radius,
      detail
    );


  const knobs =
    [];

  const goldenAngle =
    Math.PI *
    (3 - Math.sqrt(5));


  for (
    let i = 0;
    i < knobCount;
    i++
  ) {

    const y =
      1 -
      (i / (knobCount - 1)) * 2;

    const r =
      Math.sqrt(
        Math.max(
          0,
          1 - y * y
        )
      );

    const theta =
      goldenAngle * i;


    knobs.push(
      new THREE.Vector3(
        Math.cos(theta) * r,
        y,
        Math.sin(theta) * r
      )
    );

  }


  const pos =
    geo.attributes.position;

  const v =
    new THREE.Vector3();


  for (
    let i = 0;
    i < pos.count;
    i++
  ) {

    v
      .fromBufferAttribute(
        pos,
        i
      )
      .normalize();


    let bump =
      0;


    for (
      let k = 0;
      k < knobs.length;
      k++
    ) {

      const d =
        v.distanceTo(
          knobs[k]
        );

      const t =
        Math.min(
          1,
          d / knobFalloff
        );

      bump +=
        0.5 *
        (
          1 +
          Math.cos(
            Math.PI * t
          )
        );

    }


    bump =
      Math.min(
        bump,
        1.5
      );


    v.multiplyScalar(
      radius *
      (
        1 +
        bump *
        knobHeight
      )
    );


    pos.setXYZ(
      i,
      v.x,
      v.y,
      v.z
    );

  }


  pos.needsUpdate =
    true;

  geo.computeVertexNormals();

  // The geometry repeats vertices for each triangle. Average normals at
  // matching positions to keep the glossy surface from looking faceted.
  const normals = geo.attributes.normal;
  const sharedNormals = new Map();
  const vertexKeys = [];
  const faceNormal = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    const key = [pos.getX(i), pos.getY(i), pos.getZ(i)]
      .map((coordinate) => Math.round(coordinate * 1e6))
      .join(',');
    vertexKeys.push(key);

    if (!sharedNormals.has(key)) {
      sharedNormals.set(key, new THREE.Vector3());
    }

    sharedNormals.get(key).add(faceNormal.fromBufferAttribute(normals, i));
  }

  for (const normal of sharedNormals.values()) {
    normal.normalize();
  }

  for (let i = 0; i < pos.count; i++) {
    const normal = sharedNormals.get(vertexKeys[i]);
    normals.setXYZ(i, normal.x, normal.y, normal.z);
  }

  normals.needsUpdate = true;
  geo.computeBoundingSphere();


  geo.userData.coreRadius =
    radius;


  geo.userData.contactPoints =
    knobs.map(
      (direction) => ({
        direction:
          direction.clone(),

        radius:
          radius *
          (1 + knobHeight)
      })
    );


  geo.userData.knobs =
    knobs;

  geo.userData.knobHeight =
    knobHeight;

  geo.userData.knobFalloff =
    knobFalloff;


  return geo;

}

const candyGeo = makeKonpeitoGeometry(
  /* radius */ 0.4,
  /* knobCount */ 42,
  /* knobHeight */ 0.5,
  /* knobFalloff */ 0.35,
  /* detail */ 14
);


/* =========================================================
   CANDY SETUP
   ========================================================= */

// Dragon-style glass: tint light inside the candy, with a smooth white surface.
// Approximate the optical path through the rounded candy in its shader.
const candyMat = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  metalness: 0,
  roughness: 0,
  transmission: 1,
  thickness: 2.27,
  attenuationColor: candyColor,
  attenuationDistance: 0.155,
  ior: 1.5,
});

// Approximate a rounded volume: the optical path is longest through its
// center and shorter at grazing angles. This is not a measured thickness map.
function addCandyThickness(material) {
  material.onBeforeCompile = (shader) => {
    const transmission = THREE.ShaderChunk.transmission_fragment.replace(
      'material.thickness = thickness;',
      `material.thickness = thickness * mix(
        0.08, 1.0,
        pow(clamp(abs(dot(normalize(normal), normalize(vViewPosition))), 0.0, 1.0), 0.8)
      );`
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <transmission_fragment>', transmission
    );
  };
  material.customProgramCacheKey = () => 'candy-rounded-thickness-v1';
}

addCandyThickness(candyMat);

const placeholderCandy =
  new THREE.Mesh(
    candyGeo,
    candyMat
  );


const CANDY_RADIUS =
  candyGeo.boundingSphere.radius;


const CANDY_COLORS = [
  0xffeef4,
  0xfffef9,
  0xf9fff8,
  0xfffbfc
];


const CANDY_COLOR_WEIGHTS = [
  0.4,
  0.125,
  0.125,
  0.35
];


function pickCandyColorIndex() {

  let choice =
    Math.random();


  for (
    let index = 0;
    index <
    CANDY_COLOR_WEIGHTS.length;
    index++
  ) {

    choice -=
      CANDY_COLOR_WEIGHTS[index];


    if (
      choice <= 0
    ) {

      return index;

    }

  }


  return (
    CANDY_COLOR_WEIGHTS.length -
    1
  );

}


const candyMaterials =
  CANDY_COLORS.map(
    (color) => {

      const material =
        candyMat.clone();

      material
        .attenuationColor
        .setHex(
          color
        );

      // Cloning a material does not copy its shader callback.
      addCandyThickness(material);
      return material;

    }
  );


const TEXT_CLEAR_RADIUS =
  3;

const TEXT_SPAWN_FADE_RADIUS =
  3;

const candies =
  [];


function placeCandyRandomly(
  candy
) {

  const xRange = [
    camera.left +
      CANDY_RADIUS,

    camera.right -
      CANDY_RADIUS
  ];


  const zRange = [
    camera.bottom +
      CANDY_RADIUS,

    camera.top -
      CANDY_RADIUS
  ];


  let fallback = {

    x:
      Math.abs(xRange[0]) >
      Math.abs(xRange[1])
        ? xRange[0]
        : xRange[1],

    z:
      Math.abs(zRange[0]) >
      Math.abs(zRange[1])
        ? zRange[0]
        : zRange[1]

  };


  for (
    let attempt = 0;
    attempt < 100;
    attempt++
  ) {

    const x =
      THREE.MathUtils.randFloat(
        xRange[0],
        xRange[1]
      );

    const z =
      THREE.MathUtils.randFloat(
        zRange[0],
        zRange[1]
      );


    const distanceFromText =
      Math.hypot(
        x,
        z
      );


    const spawnChance =
      THREE.MathUtils.smoothstep(
        distanceFromText,
        TEXT_CLEAR_RADIUS,
        TEXT_CLEAR_RADIUS +
        TEXT_SPAWN_FADE_RADIUS
      );


    if (
      Math.random() >
      spawnChance
    ) {

      continue;

    }


    fallback = {
      x,
      z
    };


    candy.position.set(
      x,
      0.55,
      z
    );


    const isClear =
      candies.every(
        (other) =>
          other.position
            .distanceToSquared(
              candy.position
            ) >
          (
            CANDY_RADIUS * 2
          ) ** 2
      );


    if (
      isClear
    ) {

      return;

    }

  }


  candy.position.set(
    fallback.x,
    0.55,
    fallback.z
  );

}


for (
  let i = 0;
  i < CANDY_COUNT;
  i++
) {

  const candy =
    i === 0
      ? placeholderCandy
      : new THREE.Mesh(
          candyGeo,
          candyMat
        );


  const colorIndex =
    pickCandyColorIndex();


  candy.material =
    candyMaterials[
      colorIndex
    ];


  candy.castShadow =
    true;

  candy.receiveShadow =
    false;


  candy.userData.color =
    CANDY_COLORS[
      colorIndex
    ];


  candy.userData.velocity =
    new THREE.Vector3();


  candy.userData.resting =
    false;


  placeCandyRandomly(
    candy
  );


  candies.push(
    candy
  );

  scene.add(
    candy
  );

}


/* =========================================================
   SHADOW GRADIENT
   ========================================================= */

function projectShadowCenter(
  objectPos,
  light
) {

  const direction =
    light.target.position
      .clone()
      .sub(
        light.position
      )
      .normalize();


  const distanceToGround =
    -objectPos.y /
    direction.y;


  return new THREE.Vector3(

    objectPos.x +
      direction.x *
      distanceToGround,

    0,

    objectPos.z +
      direction.z *
      distanceToGround

  );

}


shadowGradientUniforms = {

  centers: {

    value:
      candies.map(
        (candy) =>
          projectShadowCenter(
            candy.position,
            key
          )
      )

  },


  colors: {

    value:
      candies.map(
        (candy) =>
          new THREE.Color(
            candy.userData.color
          )
      )

  },


  edgeColor: {
    value:
      new THREE.Color(
        0xd9d7d1
      )
  },


  radius: {
    value:
      CANDY_RADIUS *
      1.4
  }

};


/* =========================================================
   INTRO ANIMATION
   ========================================================= */

let introFinished =
  false;


gsap.from(
  placeholderCandy.position,
  {

    y:
      3.5,

    duration:
      1.1,

    ease:
      'bounce.out',

    delay:
      0.2,

    onComplete:
      () => {

        introFinished =
          true;

      }

  }
);


gsap.from(
  placeholderCandy.rotation,
  {

    y:
      Math.PI * 1.5,

    duration:
      1.1,

    ease:
      'power2.out',

    delay:
      0.2

  }
);


/* =========================================================
   DRAG + ROLL
   ========================================================= */

const ROLL_RADIUS =
  CANDY_RADIUS;

const ROLL_ROTATION_MULTIPLIER =
  1.7;

const ROLL_RESISTANCE =
  1.3;

const ROLL_STOP_SPEED =
  0.4;

const RELEASE_SPEED_MULTIPLIER =
  1.35;

const MAX_RELEASE_SPEED =
  8;

const CANDY_COLLISION_RESTITUTION =
  0.55;

const CANDY_COLLISION_PADDING =
  0.02;

const CONTACT_SNAP_DISTANCE =
  0.25;

const MAX_GROUND_CONTACTS =
  3;

const CONTACT_TILT_SPEED =
  10;

const MAX_CONTACT_TILT =
  0.1;


const groundPlane =
  new THREE.Plane(
    new THREE.Vector3(
      0,
      1,
      0
    ),
    0
  );


const groundRaycaster =
  new THREE.Raycaster();

const pointerNdc =
  new THREE.Vector2();


const interaction = {

  dragging:
    false,

  pointerId:
    null,

  candy:
    null,

  time:
    0,

  offsetX:
    0,

  offsetZ:
    0

};


const rollDelta =
  new THREE.Vector3();

const groundPoint =
  new THREE.Vector3();

const rollAxis =
  new THREE.Vector3();

const worldUp =
  new THREE.Vector3(
    0,
    1,
    0
  );

const lowestContact = {
  sample: null,
  y: 0
};

const nearbyContacts =
  [];

const contactOffset =
  new THREE.Vector3();

const contactAxis =
  new THREE.Vector3();

const collisionNormal =
  new THREE.Vector3();

const collisionMove =
  new THREE.Vector3();

const collisionVelocity =
  new THREE.Vector3();


let previousFrameTime =
  performance.now();


function pointerToGround(
  event,
  target
) {

  const rect =
    renderer.domElement
      .getBoundingClientRect();


  pointerNdc.set(

    (
      (
        event.clientX -
        rect.left
      ) /
      rect.width
    ) * 2 - 1,


    -(
      (
        event.clientY -
        rect.top
      ) /
      rect.height
    ) * 2 + 1

  );


  groundRaycaster
    .setFromCamera(
      pointerNdc,
      camera
    );


  return (
    groundRaycaster.ray
      .intersectPlane(
        groundPlane,
        target
      ) !== null
  );

}


function rollCandy(
  candy,
  move
) {

  const distance =
    move.length();


  if (
    distance === 0
  ) {

    return;

  }


  candy.userData.resting =
    false;


  candy.position.x +=
    move.x;

  candy.position.z +=
    move.z;


  rollAxis
    .crossVectors(
      move,
      worldUp
    )
    .normalize();


  candy.rotateOnWorldAxis(

    rollAxis,

    (
      distance /
      ROLL_RADIUS
    ) *
    ROLL_ROTATION_MULTIPLIER

  );

}


/* =========================================================
   FLOOR CONTACT
   ========================================================= */

const tempContactVector =
  new THREE.Vector3();

const tempPrimaryVector =
  new THREE.Vector3();


function settleCandyOnGround(
  candy,
  deltaSeconds
) {

  const samples =
    candyGeo
      .userData
      .contactPoints;


  const isResting =
    candy.userData.resting;


  const snapAmount =
    isResting
      ? 1
      : 1 -
        Math.exp(
          -CONTACT_TILT_SPEED *
          deltaSeconds
        );


  const contactThreshold =
    isResting
      ? Infinity
      : CONTACT_SNAP_DISTANCE;


  for (
    let pass = 0;
    pass <
      (isResting ? 10 : 2);
    pass++
  ) {

    lowestContact.sample =
      null;

    lowestContact.y =
      Infinity;

    nearbyContacts.length =
      0;


    for (
      const sample
      of samples
    ) {

      const y =
        tempContactVector
          .copy(
            sample.direction
          )
          .multiplyScalar(
            sample.radius
          )
          .applyQuaternion(
            candy.quaternion
          )
          .y;


      if (
        y <
        lowestContact.y
      ) {

        lowestContact.sample =
          sample;

        lowestContact.y =
          y;

      }

    }


    for (
      const sample
      of samples
    ) {

      const y =
        tempContactVector
          .copy(
            sample.direction
          )
          .multiplyScalar(
            sample.radius
          )
          .applyQuaternion(
            candy.quaternion
          )
          .y;


      const gap =
        y -
        lowestContact.y;


      if (
        sample !==
          lowestContact.sample &&
        gap <=
          contactThreshold
      ) {

        nearbyContacts.push({
          sample,
          gap
        });

      }

    }


    nearbyContacts.sort(
      (a, b) =>
        a.gap -
        b.gap
    );


    for (
      const contact
      of nearbyContacts.slice(
        0,
        MAX_GROUND_CONTACTS -
        1
      )
    ) {

      contactOffset
        .copy(
          contact.sample.direction
        )
        .multiplyScalar(
          contact.sample.radius
        )
        .applyQuaternion(
          candy.quaternion
        );


      tempPrimaryVector
        .copy(
          lowestContact
            .sample
            .direction
        )
        .multiplyScalar(
          lowestContact
            .sample
            .radius
        )
        .applyQuaternion(
          candy.quaternion
        );


      contactOffset.sub(
        tempPrimaryVector
      );


      const horizontalDistance =
        Math.hypot(
          contactOffset.x,
          contactOffset.z
        );


      if (
        horizontalDistance <
        0.0001
      ) {

        continue;

      }


      contactAxis.set(

        -contactOffset.z /
          horizontalDistance,

        0,

        contactOffset.x /
          horizontalDistance

      );


      const tilt =
        Math.min(

          MAX_CONTACT_TILT,

          (
            contactOffset.y /
            horizontalDistance
          ) *
          snapAmount

        );


      candy.rotateOnWorldAxis(
        contactAxis,
        -tilt
      );

    }

  }


  let lowestY =
    Infinity;


  for (
    const sample
    of samples
  ) {

    const y =
      tempContactVector
        .copy(
          sample.direction
        )
        .multiplyScalar(
          sample.radius
        )
        .applyQuaternion(
          candy.quaternion
        )
        .y;


    lowestY =
      Math.min(
        lowestY,
        y
      );

  }


  candy.position.y =
    -lowestY;

}


/* =========================================================
   COLLISIONS
   ========================================================= */

function resolveCandyCollisions() {

  const collisionDistance =
    CANDY_RADIUS * 2 +
    CANDY_COLLISION_PADDING;


  for (
    let i = 0;
    i < candies.length - 1;
    i++
  ) {

    for (
      let j = i + 1;
      j < candies.length;
      j++
    ) {

      const a =
        candies[i];

      const b =
        candies[j];


      collisionNormal.set(

        b.position.x -
          a.position.x,

        0,

        b.position.z -
          a.position.z

      );


      const distance =
        collisionNormal.length();


      if (
        distance >=
        collisionDistance
      ) {

        continue;

      }


      const aIsDragged =
        interaction.dragging &&
        interaction.candy === a;


      const bIsDragged =
        interaction.dragging &&
        interaction.candy === b;


      const inverseMassA =
        aIsDragged ? 0 : 1;


      const inverseMassB =
        bIsDragged ? 0 : 1;


      const inverseMassTotal =
        inverseMassA +
        inverseMassB;


      if (
        inverseMassTotal === 0
      ) {

        continue;

      }


      if (
        distance <
        0.0001
      ) {

        collisionNormal.set(
          1,
          0,
          0
        );

      } else {

        collisionNormal
          .multiplyScalar(
            1 / distance
          );

      }


      const correction =
        collisionDistance -
        distance;


      if (
        inverseMassA > 0
      ) {

        collisionMove
          .copy(
            collisionNormal
          )
          .multiplyScalar(
            -correction *
            inverseMassA /
            inverseMassTotal
          );


        rollCandy(
          a,
          collisionMove
        );

      }


      if (
        inverseMassB > 0
      ) {

        collisionMove
          .copy(
            collisionNormal
          )
          .multiplyScalar(
            correction *
            inverseMassB /
            inverseMassTotal
          );


        rollCandy(
          b,
          collisionMove
        );

      }


      const relativeNormalSpeed =
        collisionVelocity
          .copy(
            b.userData.velocity
          )
          .sub(
            a.userData.velocity
          )
          .dot(
            collisionNormal
          );


      if (
        relativeNormalSpeed >= 0
      ) {

        continue;

      }


      const impulse =
        -(
          1 +
          CANDY_COLLISION_RESTITUTION
        ) *
        relativeNormalSpeed /
        inverseMassTotal;


      if (
        inverseMassA > 0
      ) {

        a.userData.velocity
          .addScaledVector(
            collisionNormal,
            -impulse *
            inverseMassA
          );

      }


      if (
        inverseMassB > 0
      ) {

        b.userData.velocity
          .addScaledVector(
            collisionNormal,
            impulse *
            inverseMassB
          );

      }

    }

  }

}


/* =========================================================
   POINTER EVENTS
   ========================================================= */

hero.addEventListener(
  'pointerdown',
  (event) => {

    if (
      event.target.closest?.(
        'a, button, input, textarea, select, label'
      )
    ) {

      return;

    }


    if (
      !introFinished ||
      !pointerToGround(
        event,
        groundPoint
      )
    ) {

      return;

    }


    let selectedCandy =
      null;

    let closestHit =
      Infinity;


    for (
      const candy
      of candies
    ) {

      const hitDistance =
        Math.hypot(

          groundPoint.x -
            candy.position.x,

          groundPoint.z -
            candy.position.z

        );


      if (
        hitDistance <=
          ROLL_RADIUS &&
        hitDistance <
          closestHit
      ) {

        selectedCandy =
          candy;

        closestHit =
          hitDistance;

      }

    }


    if (
      !selectedCandy
    ) {

      return;

    }


    interaction.dragging =
      true;

    interaction.pointerId =
      event.pointerId;

    interaction.candy =
      selectedCandy;

    interaction.time =
      event.timeStamp;

    interaction.offsetX =
      groundPoint.x -
      selectedCandy.position.x;

    interaction.offsetZ =
      groundPoint.z -
      selectedCandy.position.z;


    selectedCandy
      .userData
      .velocity
      .set(
        0,
        0,
        0
      );


    selectedCandy
      .userData
      .resting =
      false;


    hero.setPointerCapture(
      event.pointerId
    );


    hero.style.cursor =
      'grabbing';


    event.preventDefault();

  }
);


hero.addEventListener(
  'pointermove',
  (event) => {

    if (
      !interaction.dragging ||
      event.pointerId !==
        interaction.pointerId
    ) {

      return;

    }


    if (
      !pointerToGround(
        event,
        groundPoint
      )
    ) {

      return;

    }


    const candy =
      interaction.candy;


    const elapsed =
      Math.max(

        (
          event.timeStamp -
          interaction.time
        ) /
        1000,

        1 / 120

      );


    rollDelta.set(

      groundPoint.x -
        interaction.offsetX -
        candy.position.x,

      0,

      groundPoint.z -
        interaction.offsetZ -
        candy.position.z

    );


    rollCandy(
      candy,
      rollDelta
    );


    candy
      .userData
      .velocity
      .copy(
        rollDelta
      )
      .multiplyScalar(
        1 / elapsed
      )
      .clampLength(
        0,
        4
      );


    interaction.time =
      event.timeStamp;


    event.preventDefault();

  }
);


function releaseCandy(
  event
) {

  if (
    !interaction.dragging ||
    event.pointerId !==
      interaction.pointerId
  ) {

    return;

  }


  const candy =
    interaction.candy;


  interaction.dragging =
    false;


  candy
    .userData
    .velocity
    .multiplyScalar(
      RELEASE_SPEED_MULTIPLIER
    )
    .clampLength(
      0,
      MAX_RELEASE_SPEED
    );


  interaction.candy =
    null;


  if (
    hero.hasPointerCapture(
      event.pointerId
    )
  ) {

    hero.releasePointerCapture(
      event.pointerId
    );

  }


  hero.style.cursor =
    '';

}


hero.addEventListener(
  'pointerup',
  releaseCandy
);


hero.addEventListener(
  'pointercancel',
  releaseCandy
);


/* =========================================================
   RESIZE
   ========================================================= */

function handleResize() {

  width =
    hero.clientWidth;

  height =
    hero.clientHeight;


  fitCameraFrustum();

  fitGroundToViewport();


  renderer.setSize(
    width,
    height
  );

}


let resizeTimer;


window.addEventListener(
  'resize',
  () => {

    clearTimeout(
      resizeTimer
    );


    resizeTimer =
      setTimeout(
        handleResize,
        150
      );

  }
);


/* =========================================================
   RENDER LOOP
   ========================================================= */

function tick() {

  requestAnimationFrame(
    tick
  );


  const now =
    performance.now();


  const deltaSeconds =
    Math.min(

      (
        now -
        previousFrameTime
      ) /
      1000,

      0.05

    );


  previousFrameTime =
    now;


  if (
    introFinished
  ) {

    for (
      const candy
      of candies
    ) {

      const isDragging =
        interaction.dragging &&
        interaction.candy ===
          candy;


      const velocity =
        candy.userData.velocity;


      if (
        !isDragging &&
        velocity.lengthSq() >
          ROLL_STOP_SPEED ** 2
      ) {

        rollCandy(

          candy,

          rollDelta
            .copy(
              velocity
            )
            .multiplyScalar(
              deltaSeconds
            )

        );


        velocity.multiplyScalar(

          Math.exp(
            -ROLL_RESISTANCE *
            deltaSeconds
          )

        );

      } else if (
        !isDragging
      ) {

        velocity.set(
          0,
          0,
          0
        );


        candy.userData.resting =
          true;

      }

    }


    resolveCandyCollisions();


    for (
      const candy
      of candies
    ) {

      settleCandyOnGround(
        candy,
        deltaSeconds
      );

    }

  }


  for (
    const [index, candy]
    of candies.entries()
  ) {

    shadowGradientUniforms
      .centers
      .value[index]
      .copy(

        projectShadowCenter(
          candy.position,
          key
        )

      );

  }


  renderer.render(
    scene,
    camera
  );

}


tick();
