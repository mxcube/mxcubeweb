/* eslint-disable react/jsx-handler-names */
import React from 'react';

import styles from './PeriodicTable.module.css';

export default class PeriodicTable extends React.Component {
  constructor(props) {
    super(props);
    this.onClickHandler = this.onClickHandler.bind(this);
    this.state = { selectedElement: null };
  }

  onClickHandler(e) {
    if (e.target.id) {
      const el = document.querySelector(`#${this.state.selectedElement}`);
      const cell = e.target.children[0];

      if (el) {
        el.children[0].className = styles.element;
      }

      this.props.onElementSelected(e.target.id, null);

      this.setState({ selectedElement: e.target.id });
      /* eslint-enable react/no-set-state */
      cell.className += ` ${styles.selected}`;
    }
  }

  enableElement(el) {
    const domel = document.querySelector(`#${el}`);

    if (domel) {
      domel.className += ` ${styles.available}`;
    }
  }

  render() {
    this.props.availableElements.forEach((el) => {
      this.enableElement(el);
    });

    return (
      <div className={styles.periodic} onClick={this.onClickHandler}>
        <div className={styles.periodicRow}>
          <div id="H" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>1</div>
              <div className={styles.symbol}>H</div>
              <div className={styles.at_details}>
                hydrogen
                <br />
                1.008
              </div>
            </div>
          </div>
          <div className={styles.cell} />
          <div className={styles.cell} />
          <div className={styles.cell} />
          <div className={styles.cell} />
          <div className={styles.cell} />
          <div className={styles.cell} />
          <div className={styles.cell} />
          <div className={styles.cell} />
          <div className={styles.cell} />
          <div className={styles.cell} />
          <div className={styles.cell} />
          <div className={styles.cell} />
          <div className={styles.cell} />
          <div className={styles.cell} />
          <div className={styles.cell} />
          <div className={styles.cell} />
          <div id="He" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>2</div>
              <div className={styles.symbol}>He</div>
              <div className={styles.at_details}>
                helium
                <br />
                4.0026
              </div>
            </div>
          </div>
        </div>
        <div className={styles.periodicRow}>
          <div id="Li" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>3</div>
              <div className={styles.symbol}>Li</div>
              <div className={styles.at_details}>
                lithium
                <br />
                6.94
              </div>
            </div>
          </div>
          <div id="Be" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>4</div>
              <div className={styles.symbol}>Be</div>
              <div className={styles.at_details}>
                beryllium
                <br />
                9.0122
              </div>
            </div>
          </div>
          <div className={styles.cell} />
          <div className={styles.cell} />
          <div className={styles.cell} />
          <div className={styles.cell} />
          <div className={styles.cell} />
          <div className={styles.cell} />
          <div className={styles.cell} />
          <div className={styles.cell} />
          <div className={styles.cell} />
          <div className={styles.cell} />
          <div id="B" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>5</div>
              <div className={styles.symbol}>B</div>
              <div className={styles.at_details}>
                boron
                <br />
                10.81
              </div>
            </div>
          </div>
          <div id="C" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>6</div>
              <div className={styles.symbol}>C</div>
              <div className={styles.at_details}>
                carbon
                <br />
                12.011
              </div>
            </div>
          </div>
          <div id="N" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>7</div>
              <div className={styles.symbol}>N</div>
              <div className={styles.at_details}>
                nidivogen
                <br />
                14.007
              </div>
            </div>
          </div>
          <div id="O" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>8</div>
              <div className={styles.symbol}>O</div>
              <div className={styles.at_details}>
                oxygen
                <br />
                15.999
              </div>
            </div>
          </div>
          <div id="F" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>9</div>
              <div className={styles.symbol}>F</div>
              <div className={styles.at_details}>
                fluorine
                <br />
                18.998
              </div>
            </div>
          </div>
          <div id="Ne" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>10</div>
              <div className={styles.symbol}>Ne</div>
              <div className={styles.at_details}>
                neon
                <br />
                20.180
              </div>
            </div>
          </div>
        </div>
        <div className={styles.periodicRow}>
          <div id="Na" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>11</div>
              <div className={styles.symbol}>Na</div>
              <div className={styles.at_details}>
                sodium
                <br />
                22.990
              </div>
            </div>
          </div>
          <div id="Mg" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>12</div>
              <div className={styles.symbol}>Mg</div>
              <div className={styles.at_details}>
                magnesium
                <br />
                24.305
              </div>
            </div>
          </div>
          <div className={styles.cell} />
          <div className={styles.cell} />
          <div className={styles.cell} />
          <div className={styles.cell} />
          <div className={styles.cell} />
          <div className={styles.cell} />
          <div className={styles.cell} />
          <div className={styles.cell} />
          <div className={styles.cell} />
          <div className={styles.cell} />
          <div id="Al" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>13</div>
              <div className={styles.symbol}>Al</div>
              <div className={styles.at_details}>
                aluminum
                <br />
                26.982
              </div>
            </div>
          </div>
          <div id="Si" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>14</div>
              <div className={styles.symbol}>Si</div>
              <div className={styles.at_details}>
                silicon
                <br />
                28.085
              </div>
            </div>
          </div>
          <div id="P" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>15</div>
              <div className={styles.symbol}>P</div>
              <div className={styles.at_details}>
                phosphorus
                <br />
                30.974
              </div>
            </div>
          </div>
          <div id="S" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>16</div>
              <div className={styles.symbol}>S</div>
              <div className={styles.at_details}>
                sulfur
                <br />
                32.06
              </div>
            </div>
          </div>
          <div id="Cl" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>17</div>
              <div className={styles.symbol}>Cl</div>
              <div className={styles.at_details}>
                chlorine
                <br />
                35.45
              </div>
            </div>
          </div>
          <div id="Ar" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>18</div>
              <div className={styles.symbol}>Ar</div>
              <div className={styles.at_details}>
                argon
                <br />
                39.948
              </div>
            </div>
          </div>
        </div>
        <div className={styles.periodicRow}>
          <div id="K" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>19</div>
              <div className={styles.symbol}>K</div>
              <div className={styles.at_details}>
                potassium
                <br />
                39.098
              </div>
            </div>
          </div>
          <div id="Ca" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>20</div>
              <div className={styles.symbol}>Ca</div>
              <div className={styles.at_details}>
                calcium
                <br />
                40.078
              </div>
            </div>
          </div>
          <div id="Sc" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>21</div>
              <div className={styles.symbol}>Sc</div>
              <div className={styles.at_details}>
                scandium
                <br />
                44.956
              </div>
            </div>
          </div>
          <div id="Ti" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>22</div>
              <div className={styles.symbol}>Ti</div>
              <div className={styles.at_details}>
                titanium
                <br />
                47.867
              </div>
            </div>
          </div>
          <div id="V" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>23</div>
              <div className={styles.symbol}>V</div>
              <div className={styles.at_details}>
                vanadium
                <br />
                50.942
              </div>
            </div>
          </div>
          <div id="Cr" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>24</div>
              <div className={styles.symbol}>Cr</div>
              <div className={styles.at_details}>
                chromium
                <br />
                51.996
              </div>
            </div>
          </div>
          <div id="Mn" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>25</div>
              <div className={styles.symbol}>Mn</div>
              <div className={styles.at_details}>
                manganese
                <br />
                54.938
              </div>
            </div>
          </div>
          <div id="Fe" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>26</div>
              <div className={styles.symbol}>Fe</div>
              <div className={styles.at_details}>
                iron
                <br />
                55.845
              </div>
            </div>
          </div>
          <div id="Co" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>27</div>
              <div className={styles.symbol}>Co</div>
              <div className={styles.at_details}>
                cobalt
                <br />
                58.933
              </div>
            </div>
          </div>
          <div id="Ni" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>28</div>
              <div className={styles.symbol}>Ni</div>
              <div className={styles.at_details}>
                nickel
                <br />
                58.693
              </div>
            </div>
          </div>
          <div id="Cu" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>29</div>
              <div className={styles.symbol}>Cu</div>
              <div className={styles.at_details}>
                copper
                <br />
                63.546
              </div>
            </div>
          </div>
          <div id="Zn" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>30</div>
              <div className={styles.symbol}>Zn</div>
              <div className={styles.at_details}>
                zinc
                <br />
                65.38
              </div>
            </div>
          </div>
          <div id="Ga" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>31</div>
              <div className={styles.symbol}>Ga</div>
              <div className={styles.at_details}>
                gallium
                <br />
                69.723
              </div>
            </div>
          </div>
          <div id="Ge" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>32</div>
              <div className={styles.symbol}>Ge</div>
              <div className={styles.at_details}>
                germanium
                <br />
                72.63
              </div>
            </div>
          </div>
          <div id="As" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>33</div>
              <div className={styles.symbol}>As</div>
              <div className={styles.at_details}>
                arsenic
                <br />
                74.922
              </div>
            </div>
          </div>
          <div id="Se" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>34</div>
              <div className={styles.symbol}>Se</div>
              <div className={styles.at_details}>
                selenium
                <br />
                78.96
              </div>
            </div>
          </div>
          <div id="Br" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>35</div>
              <div className={styles.symbol}>Br</div>
              <div className={styles.at_details}>
                bromine
                <br />
                79.904
              </div>
            </div>
          </div>
          <div id="Kr" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>36</div>
              <div className={styles.symbol}>Kr</div>
              <div className={styles.at_details}>
                krypton
                <br />
                83.798
              </div>
            </div>
          </div>
        </div>
        <div className={styles.periodicRow}>
          <div id="Rb" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>37</div>
              <div className={styles.symbol}>Rb</div>
              <div className={styles.at_details}>
                rubidium
                <br />
                85.468
              </div>
            </div>
          </div>
          <div id="Sr" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>38</div>
              <div className={styles.symbol}>Sr</div>
              <div className={styles.at_details}>
                sdivontium
                <br />
                87.62
              </div>
            </div>
          </div>
          <div id="Y" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>39</div>
              <div className={styles.symbol}>Y</div>
              <div className={styles.at_details}>
                ytdivium
                <br />
                88.906
              </div>
            </div>
          </div>
          <div id="Zr" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>40</div>
              <div className={styles.symbol}>Zr</div>
              <div className={styles.at_details}>
                zirconium
                <br />
                91.224
              </div>
            </div>
          </div>
          <div id="Nb" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>41</div>
              <div className={styles.symbol}>Nb</div>
              <div className={styles.at_details}>
                niobium
                <br />
                92.906
              </div>
            </div>
          </div>
          <div id="Mo" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>42</div>
              <div className={styles.symbol}>Mo</div>
              <div className={styles.at_details}>
                molybdenum
                <br />
                95.96
              </div>
            </div>
          </div>
          <div id="Tc" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>43</div>
              <div className={styles.symbol}>Tc</div>
              <div className={styles.at_details}>
                technetium
                <br />
                [97.91]
              </div>
            </div>
          </div>
          <div id="Ru" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>44</div>
              <div className={styles.symbol}>Ru</div>
              <div className={styles.at_details}>
                ruthenium
                <br />
                101.07
              </div>
            </div>
          </div>
          <div id="Rh" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>45</div>
              <div className={styles.symbol}>Rh</div>
              <div className={styles.at_details}>
                rhodium
                <br />
                102.91
              </div>
            </div>
          </div>
          <div id="Pd" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>46</div>
              <div className={styles.symbol}>Pd</div>
              <div className={styles.at_details}>
                palladium
                <br />
                106.42
              </div>
            </div>
          </div>
          <div id="Ag" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>47</div>
              <div className={styles.symbol}>Ag</div>
              <div className={styles.at_details}>
                silver
                <br />
                107.87
              </div>
            </div>
          </div>
          <div id="Cd" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>48</div>
              <div className={styles.symbol}>Cd</div>
              <div className={styles.at_details}>
                cadmium
                <br />
                112.41
              </div>
            </div>
          </div>
          <div id="In" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>49</div>
              <div className={styles.symbol}>In</div>
              <div className={styles.at_details}>
                indium
                <br />
                114.82
              </div>
            </div>
          </div>
          <div id="Sn" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>50</div>
              <div className={styles.symbol}>Sn</div>
              <div className={styles.at_details}>
                tin
                <br />
                118.71
              </div>
            </div>
          </div>
          <div id="Sb" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>51</div>
              <div className={styles.symbol}>Sb</div>
              <div className={styles.at_details}>
                antimony
                <br />
                121.76
              </div>
            </div>
          </div>
          <div id="Te" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>52</div>
              <div className={styles.symbol}>Te</div>
              <div className={styles.at_details}>
                tellurium
                <br />
                127.60
              </div>
            </div>
          </div>
          <div id="I" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>53</div>
              <div className={styles.symbol}>I</div>
              <div className={styles.at_details}>
                iodine
                <br />
                126.90
              </div>
            </div>
          </div>
          <div id="Xe" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>54</div>
              <div className={styles.symbol}>Xe</div>
              <div className={styles.at_details}>
                xenon
                <br />
                131.29
              </div>
            </div>
          </div>
        </div>
        <div className={styles.periodicRow}>
          <div id="Cs" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>55</div>
              <div className={styles.symbol}>Cs</div>
              <div className={styles.at_details}>
                cesium
                <br />
                132.91
              </div>
            </div>
          </div>
          <div id="Ba" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>56</div>
              <div className={styles.symbol}>Ba</div>
              <div className={styles.at_details}>
                barium
                <br />
                137.33
              </div>
            </div>
          </div>
          <div className={styles.cell} />
          <div id="Hf" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>72</div>
              <div className={styles.symbol}>Hf</div>
              <div className={styles.at_details}>
                hafnium
                <br />
                178.49
              </div>
            </div>
          </div>
          <div id="Ta" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>73</div>
              <div className={styles.symbol}>Ta</div>
              <div className={styles.at_details}>
                tantalum
                <br />
                180.95
              </div>
            </div>
          </div>
          <div id="W" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>74</div>
              <div className={styles.symbol}>W</div>
              <div className={styles.at_details}>
                tungsten
                <br />
                183.84
              </div>
            </div>
          </div>
          <div id="Re" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>75</div>
              <div className={styles.symbol}>Re</div>
              <div className={styles.at_details}>
                rhenium
                <br />
                186.21
              </div>
            </div>
          </div>
          <div id="Os" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>76</div>
              <div className={styles.symbol}>Os</div>
              <div className={styles.at_details}>
                osmium
                <br />
                190.23
              </div>
            </div>
          </div>
          <div id="Ir" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>77</div>
              <div className={styles.symbol}>Ir</div>
              <div className={styles.at_details}>
                iridium
                <br />
                192.22
              </div>
            </div>
          </div>
          <div id="Pt" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>78</div>
              <div className={styles.symbol}>Pt</div>
              <div className={styles.at_details}>
                platinum
                <br />
                195.08
              </div>
            </div>
          </div>
          <div id="Au" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>79</div>
              <div className={styles.symbol}>Au</div>
              <div className={styles.at_details}>
                gold
                <br />
                196.97
              </div>
            </div>
          </div>
          <div id="Hg" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>80</div>
              <div className={styles.symbol}>Hg</div>
              <div className={styles.at_details}>
                mercury
                <br />
                200.59
              </div>
            </div>
          </div>
          <div id="Tl" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>81</div>
              <div className={styles.symbol}>Tl</div>
              <div className={styles.at_details}>
                thallium
                <br />
                204.38
              </div>
            </div>
          </div>
          <div id="Pb" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>82</div>
              <div className={styles.symbol}>Pb</div>
              <div className={styles.at_details}>
                lead
                <br />
                207.2
              </div>
            </div>
          </div>
          <div id="Bi" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>83</div>
              <div className={styles.symbol}>Bi</div>
              <div className={styles.at_details}>
                bismuth
                <br />
                208.98
              </div>
            </div>
          </div>
          <div id="Po" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>84</div>
              <div className={styles.symbol}>Po</div>
              <div className={styles.at_details}>
                polonium
                <br />
                [208.98]
              </div>
            </div>
          </div>
          <div id="At" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>85</div>
              <div className={styles.symbol}>At</div>
              <div className={styles.at_details}>
                astatine
                <br />
                [209.99]
              </div>
            </div>
          </div>
          <div id="Rn" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>86</div>
              <div className={styles.symbol}>Rn</div>
              <div className={styles.at_details}>
                radon
                <br />
                [222.02]
              </div>
            </div>
          </div>
        </div>
        <div className={styles.periodicRow}>
          <div id="Fr" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>87</div>
              <div className={styles.symbol}>Fr</div>
              <div className={styles.at_details}>
                francium
                <br />
                [223.02]
              </div>
            </div>
          </div>
          <div id="Ra" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>88</div>
              <div className={styles.symbol}>Ra</div>
              <div className={styles.at_details}>
                radium
                <br />
                [226.03]
              </div>
            </div>
          </div>
          <div className={styles.cell} />
          <div id="Rf" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>104</div>
              <div className={styles.symbol}>Rf</div>
              <div className={styles.at_details}>
                rutherfordium
                <br />
                [265.12]
              </div>
            </div>
          </div>
          <div id="Db" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>105</div>
              <div className={styles.symbol}>Db</div>
              <div className={styles.at_details}>
                dubnium
                <br />
                [268.13]
              </div>
            </div>
          </div>
          <div id="Sg" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>106</div>
              <div className={styles.symbol}>Sg</div>
              <div className={styles.at_details}>
                seaborgium
                <br />
                [271.13]
              </div>
            </div>
          </div>
          <div id="Bh" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>107</div>
              <div className={styles.symbol}>Bh</div>
              <div className={styles.at_details}>
                bohrium
                <br />
                [270]
              </div>
            </div>
          </div>
          <div id="Hs" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>108</div>
              <div className={styles.symbol}>Hs</div>
              <div className={styles.at_details}>
                hassium
                <br />
                [277.15]
              </div>
            </div>
          </div>
          <div id="Mt" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>109</div>
              <div className={styles.symbol}>Mt</div>
              <div className={styles.at_details}>
                meitnerium
                <br />
                [276.15]
              </div>
            </div>
          </div>
          <div id="Ds" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>110</div>
              <div className={styles.symbol}>Ds</div>
              <div className={styles.at_details}>
                darmstadtium
                <br />
                [281.16]
              </div>
            </div>
          </div>
          <div id="Rg" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>111</div>
              <div className={styles.symbol}>Rg</div>
              <div className={styles.at_details}>
                roentgenium
                <br />
                [280.16]
              </div>
            </div>
          </div>
          <div id="Cn" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>112</div>
              <div className={styles.symbol}>Cn</div>
              <div className={styles.at_details}>
                copernicium
                <br />
                [285.17]
              </div>
            </div>
          </div>
          <div id="Uut" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>113</div>
              <div className={styles.symbol}>Uut</div>
              <div className={styles.at_details}>
                unundivium
                <br />
                [284.18]
              </div>
            </div>
          </div>
          <div id="Fl" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>114</div>
              <div className={styles.symbol}>Fl</div>
              <div className={styles.at_details}>
                flerovium
                <br />
                [289.19]
              </div>
            </div>
          </div>
          <div id="Uup" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>115</div>
              <div className={styles.symbol}>Uup</div>
              <div className={styles.at_details}>
                ununpentium
                <br />
                [288.19]
              </div>
            </div>
          </div>
          <div id="Lv" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>116</div>
              <div className={styles.symbol}>Lv</div>
              <div className={styles.at_details}>
                livermorium
                <br />
                [293]
              </div>
            </div>
          </div>
          <div id="Uus" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>117</div>
              <div className={styles.symbol}>Uus</div>
              <div className={styles.at_details}>
                ununseptium
                <br />
                [294]
              </div>
            </div>
          </div>
          <div id="Uuo" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>118</div>
              <div className={styles.symbol}>Uuo</div>
              <div className={styles.at_details}>
                ununoctium
                <br />
                [294]
              </div>
            </div>
          </div>
        </div>
        <div className={styles.periodicRow} />
        <div className={styles.periodicRow}>
          <div className={styles.cell} />
          <div className={styles.cell} />
          <div className={styles.cell} />
          <div id="La" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>57</div>
              <div className={styles.symbol}>La</div>
              <div className={styles.at_details}>
                lanthanum
                <br />
                138.91
              </div>
            </div>
          </div>
          <div id="Ce" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>58</div>
              <div className={styles.symbol}>Ce</div>
              <div className={styles.at_details}>
                cerium
                <br />
                140.12
              </div>
            </div>
          </div>
          <div id="Pr" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>59</div>
              <div className={styles.symbol}>Pr</div>
              <div className={styles.at_details}>
                praseodymium
                <br />
                140.91
              </div>
            </div>
          </div>
          <div id="Nd" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>60</div>
              <div className={styles.symbol}>Nd</div>
              <div className={styles.at_details}>
                neodymium
                <br />
                144.24
              </div>
            </div>
          </div>
          <div id="Pm" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>61</div>
              <div className={styles.symbol}>Pm</div>
              <div className={styles.at_details}>
                promethium
                <br />
                [144.91]
              </div>
            </div>
          </div>
          <div id="Sm" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>62</div>
              <div className={styles.symbol}>Sm</div>
              <div className={styles.at_details}>
                samarium
                <br />
                150.36
              </div>
            </div>
          </div>
          <div id="Eu" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>63</div>
              <div className={styles.symbol}>Eu</div>
              <div className={styles.at_details}>
                europium
                <br />
                151.96
              </div>
            </div>
          </div>
          <div id="Gd" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>64</div>
              <div className={styles.symbol}>Gd</div>
              <div className={styles.at_details}>
                gadolinium
                <br />
                157.25
              </div>
            </div>
          </div>
          <div id="Tb" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>65</div>
              <div className={styles.symbol}>Tb</div>
              <div className={styles.at_details}>
                terbium
                <br />
                158.93
              </div>
            </div>
          </div>
          <div id="Dy" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>66</div>
              <div className={styles.symbol}>Dy</div>
              <div className={styles.at_details}>
                dysprosium
                <br />
                162.50
              </div>
            </div>
          </div>
          <div id="Ho" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>67</div>
              <div className={styles.symbol}>Ho</div>
              <div className={styles.at_details}>
                holmium
                <br />
                164.93
              </div>
            </div>
          </div>
          <div id="Er" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>68</div>
              <div className={styles.symbol}>Er</div>
              <div className={styles.at_details}>
                erbium
                <br />
                167.26
              </div>
            </div>
          </div>
          <div id="Tm" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>69</div>
              <div className={styles.symbol}>Tm</div>
              <div className={styles.at_details}>
                thulium
                <br />
                168.93
              </div>
            </div>
          </div>
          <div id="Yb" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>70</div>
              <div className={styles.symbol}>Yb</div>
              <div className={styles.at_details}>
                ytterbium
                <br />
                173.05
              </div>
            </div>
          </div>
          <div id="Lu" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>71</div>
              <div className={styles.symbol}>Lu</div>
              <div className={styles.at_details}>
                lutetium
                <br />
                174.97
              </div>
            </div>
          </div>
        </div>
        <div className={styles.periodicRow}>
          <div className={styles.cell} />
          <div className={styles.cell} />
          <div className={styles.cell} />
          <div id="Ac" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>89</div>
              <div className={styles.symbol}>Ac</div>
              <div className={styles.at_details}>
                actinium
                <br />
                [227.03]
              </div>
            </div>
          </div>
          <div id="Th" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>90</div>
              <div className={styles.symbol}>Th</div>
              <div className={styles.at_details}>
                thorium
                <br />
                232.04
              </div>
            </div>
          </div>
          <div id="Pa" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>91</div>
              <div className={styles.symbol}>Pa</div>
              <div className={styles.at_details}>
                protactinium
                <br />
                231.04
              </div>
            </div>
          </div>
          <div id="U" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>92</div>
              <div className={styles.symbol}>U</div>
              <div className={styles.at_details}>
                uranium
                <br />
                238.03
              </div>
            </div>
          </div>
          <div id="Np" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>93</div>
              <div className={styles.symbol}>Np</div>
              <div className={styles.at_details}>
                neptunium
                <br />
                [237.05]
              </div>
            </div>
          </div>
          <div id="Pu" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>94</div>
              <div className={styles.symbol}>Pu</div>
              <div className={styles.at_details}>
                plutonium
                <br />
                [244.06]
              </div>
            </div>
          </div>
          <div id="Am" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>95</div>
              <div className={styles.symbol}>Am</div>
              <div className={styles.at_details}>
                americium
                <br />
                [243.06]
              </div>
            </div>
          </div>
          <div id="Cm" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>96</div>
              <div className={styles.symbol}>Cm</div>
              <div className={styles.at_details}>
                curium
                <br />
                [247.07]
              </div>
            </div>
          </div>
          <div id="Bk" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>97</div>
              <div className={styles.symbol}>Bk</div>
              <div className={styles.at_details}>
                berkelium
                <br />
                [247.07]
              </div>
            </div>
          </div>
          <div id="Cf" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>98</div>
              <div className={styles.symbol}>Cf</div>
              <div className={styles.at_details}>
                californium
                <br />
                [251.08]
              </div>
            </div>
          </div>
          <div id="Es" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>99</div>
              <div className={styles.symbol}>Es</div>
              <div className={styles.at_details}>
                einsteinium
                <br />
                [252.08]
              </div>
            </div>
          </div>
          <div id="Fm" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>100</div>
              <div className={styles.symbol}>Fm</div>
              <div className={styles.at_details}>
                fermium
                <br />
                [257.10]
              </div>
            </div>
          </div>
          <div id="Md" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>101</div>
              <div className={styles.symbol}>Md</div>
              <div className={styles.at_details}>
                mendelevium
                <br />
                [258.10]
              </div>
            </div>
          </div>
          <div id="No" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>102</div>
              <div className={styles.symbol}>No</div>
              <div className={styles.at_details}>
                nobelium
                <br />
                [259.10]
              </div>
            </div>
          </div>
          <div id="Lr" className={styles.cell}>
            <div className={styles.element}>
              <div className={styles.at_num}>103</div>
              <div className={styles.symbol}>Lr</div>
              <div className={styles.at_details}>
                lawrencium
                <br />
                [262.11]
              </div>
            </div>
          </div>
        </div>
        <div style={{ clear: 'both' }} />
      </div>
    );
  }
}
